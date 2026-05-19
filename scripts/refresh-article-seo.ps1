Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-MatchValue {
  param(
    [string]$Content,
    [string]$Pattern
  )

  $match = [regex]::Match($Content, $Pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if ($match.Success) {
    return $match.Groups[1].Value
  }

  return $null
}

function Set-Or-InsertTag {
  param(
    [string]$Content,
    [string]$Pattern,
    [string]$Replacement,
    [string]$AnchorPattern
  )

  if ([regex]::IsMatch($Content, $Pattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)) {
    return [regex]::Replace(
      $Content,
      $Pattern,
      $Replacement,
      [System.Text.RegularExpressions.RegexOptions]::Singleline
    )
  }

  $anchor = [regex]::Match($Content, $AnchorPattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if (-not $anchor.Success) {
    throw "Unable to find anchor pattern: $AnchorPattern"
  }

  return $Content.Insert($anchor.Index + $anchor.Length, "`r`n  $Replacement")
}

function Encode-HtmlAttribute {
  param([string]$Value)

  if ($null -eq $Value) {
    return ""
  }

  return $Value.Replace("&", "&amp;").Replace('"', "&quot;").Replace("<", "&lt;").Replace(">", "&gt;")
}

function Encode-Xml {
  param([string]$Value)

  if ($null -eq $Value) {
    return ""
  }

  return [System.Security.SecurityElement]::Escape($Value)
}

function Get-ImageAltText {
  param(
    [string]$Content,
    [string]$ImageUrl,
    [string]$Headline
  )

  if ([string]::IsNullOrWhiteSpace($ImageUrl)) {
    return "Illustration for $Headline"
  }

  $candidates = New-Object System.Collections.Generic.List[string]

  if ($ImageUrl -match "^https://pulsagi\.com/articles/(.+)$") {
    $candidates.Add($Matches[1])
  }

  if ($ImageUrl -match "^https://pulsagi\.com/(.+)$") {
    $candidates.Add("/" + $Matches[1])
    $candidates.Add($Matches[1])
  }

  foreach ($candidate in ($candidates | Select-Object -Unique)) {
    $srcPattern = 'src="' + [regex]::Escape($candidate) + '"'
    $altAfterSrc = '<img[^>]*' + $srcPattern + '[^>]*alt="([^"]+)"'
    $altBeforeSrc = '<img[^>]*alt="([^"]+)"[^>]*' + $srcPattern

    $match = [regex]::Match($Content, $altAfterSrc, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    if (-not $match.Success) {
      $match = [regex]::Match($Content, $altBeforeSrc, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    }

    if ($match.Success) {
      return $match.Groups[1].Value.Trim()
    }
  }

  return "Illustration for $Headline"
}

$root = Split-Path -Parent $PSScriptRoot
$articlesDir = Join-Path $root "articles"
$feedPath = Join-Path $articlesDir "feed.xml"
$sitemapPath = Join-Path $root "sitemap.xml"
$today = Get-Date -Format "yyyy-MM-dd"
$updatedIso = $today + "T00:00:00+05:30"
$feedEntries = @()

$canonicalArticles = Get-ChildItem $articlesDir -File -Filter *.html |
  Where-Object {
    $_.Name -ne "index.html" -and
    -not ([regex]::IsMatch((Get-Content $_.FullName -Raw), 'http-equiv="refresh"', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase))
  } |
  Sort-Object Name

foreach ($file in $canonicalArticles) {
  $content = Get-Content $file.FullName -Raw

  $canonical = Get-MatchValue -Content $content -Pattern '<link rel="canonical" href="([^"]+)"'
  $description = Get-MatchValue -Content $content -Pattern '<meta name="description" content="([^"]+)"'
  $ogImage = Get-MatchValue -Content $content -Pattern '<meta property="og:image" content="([^"]+)"'
  $title = Get-MatchValue -Content $content -Pattern '<title>(.*?)</title>'

  $articleScript = [regex]::Match(
    $content,
    '<script type="application/ld\+json">\s*(\{.*?"@type"\s*:\s*"Article".*?\})\s*</script>',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )

  if (-not $articleScript.Success) {
    throw "Unable to find primary Article JSON-LD in $($file.Name)"
  }

  $articleData = $articleScript.Groups[1].Value | ConvertFrom-Json
  $headline = if ($articleData.headline) { [string]$articleData.headline } else { ($title -replace '\s+\|\s+Pulsagi$', '').Trim() }
  $authorName = if ($articleData.author.name) { [string]$articleData.author.name } else { "Shivam Gupta" }
  $authorUrl = if ($articleData.author.url) { [string]$articleData.author.url } else { "https://shivam.pulsagi.com" }
  $datePublished = [string]$articleData.datePublished
  $dateModified = [string]$articleData.dateModified
  $imageAlt = Get-ImageAltText -Content $content -ImageUrl $ogImage -Headline $headline

  $structuredData = [ordered]@{
    "@context" = "https://schema.org"
    "@type" = "Article"
    "headline" = $headline
    "description" = [string]$articleData.description
    "author" = [ordered]@{
      "@type" = "Person"
      "name" = $authorName
      "url" = $authorUrl
    }
    "publisher" = [ordered]@{
      "@type" = "Organization"
      "name" = "Pulsagi"
      "url" = "https://pulsagi.com"
      "logo" = [ordered]@{
        "@type" = "ImageObject"
        "url" = "https://pulsagi.com/favicon.svg"
      }
    }
    "datePublished" = $datePublished
    "dateModified" = $dateModified
    "mainEntityOfPage" = [ordered]@{
      "@type" = "WebPage"
      "@id" = $canonical
    }
    "url" = $canonical
    "inLanguage" = "en"
  }

  if (-not [string]::IsNullOrWhiteSpace($ogImage)) {
    $structuredData["image"] = @($ogImage)
  }

  $articleJson = $structuredData | ConvertTo-Json -Depth 20
  $articleBlock = "<script type=""application/ld+json"">`r`n$articleJson`r`n  </script>"
  $content = [regex]::Replace(
    $content,
    '<script type="application/ld\+json">\s*\{.*?"@type"\s*:\s*"Article".*?\}\s*</script>',
    [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $articleBlock },
    [System.Text.RegularExpressions.RegexOptions]::Singleline
  )

  $robotsTag = '<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />'
  $googlebotTag = '<meta name="googlebot" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />'
  $publishedTag = '<meta property="article:published_time" content="' + (Encode-HtmlAttribute $datePublished) + '" />'
  $modifiedTag = '<meta property="article:modified_time" content="' + (Encode-HtmlAttribute $dateModified) + '" />'
  $authorTag = '<meta property="article:author" content="' + (Encode-HtmlAttribute $authorName) + '" />'
  $siteNameTag = '<meta property="og:site_name" content="Pulsagi" />'
  $ogImageAltTag = '<meta property="og:image:alt" content="' + (Encode-HtmlAttribute $imageAlt) + '" />'
  $twitterImageAltTag = '<meta name="twitter:image:alt" content="' + (Encode-HtmlAttribute $imageAlt) + '" />'
  $feedLinkTag = '<link rel="alternate" type="application/atom+xml" title="Pulsagi Articles Feed" href="https://pulsagi.com/articles/feed.xml" />'

  $content = [regex]::Replace($content, '<meta name="robots" content="[^"]*" ?/?>', $robotsTag)
  $content = Set-Or-InsertTag -Content $content -Pattern '<meta name="googlebot" content="[^"]*" ?/?>' -Replacement $googlebotTag -AnchorPattern '<meta name="robots" content="[^"]*" ?/?>'
  $content = Set-Or-InsertTag -Content $content -Pattern '<meta property="article:published_time" content="[^"]*" ?/?>' -Replacement $publishedTag -AnchorPattern '<meta name="googlebot" content="[^"]*" ?/?>'
  $content = Set-Or-InsertTag -Content $content -Pattern '<meta property="article:modified_time" content="[^"]*" ?/?>' -Replacement $modifiedTag -AnchorPattern '<meta property="article:published_time" content="[^"]*" ?/?>'
  $content = Set-Or-InsertTag -Content $content -Pattern '<meta property="article:author" content="[^"]*" ?/?>' -Replacement $authorTag -AnchorPattern '<meta property="article:modified_time" content="[^"]*" ?/?>'
  $content = Set-Or-InsertTag -Content $content -Pattern '<meta property="og:site_name" content="[^"]*" ?/?>' -Replacement $siteNameTag -AnchorPattern '<meta property="og:url" content="[^"]*" ?/?>'
  $content = Set-Or-InsertTag -Content $content -Pattern '<meta property="og:image:alt" content="[^"]*" ?/?>' -Replacement $ogImageAltTag -AnchorPattern '<meta property="og:image" content="[^"]*" ?/?>'
  $content = Set-Or-InsertTag -Content $content -Pattern '<meta name="twitter:image:alt" content="[^"]*" ?/?>' -Replacement $twitterImageAltTag -AnchorPattern '<meta name="twitter:image" content="[^"]*" ?/?>'
  $content = Set-Or-InsertTag -Content $content -Pattern '<link rel="alternate" type="application/atom\+xml" title="Pulsagi Articles Feed" href="https://pulsagi\.com/articles/feed\.xml" ?/?>' -Replacement $feedLinkTag -AnchorPattern '<link rel="canonical" href="[^"]+" ?/?>'

  [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding($false)))

  $feedEntries += [PSCustomObject]@{
    Canonical = $canonical
    Title = $headline
    Description = $description
    Published = $datePublished
    Modified = $dateModified
  }
}

$sortedEntries = $feedEntries | Sort-Object Modified, Published -Descending
$feedUpdated = if ($sortedEntries.Count -gt 0) {
  ($sortedEntries | Select-Object -First 1).Modified + "T00:00:00+05:30"
} else {
  $updatedIso
}

$feedBuilder = New-Object System.Text.StringBuilder
[void]$feedBuilder.AppendLine('<?xml version="1.0" encoding="UTF-8"?>')
[void]$feedBuilder.AppendLine('<feed xmlns="http://www.w3.org/2005/Atom">')
[void]$feedBuilder.AppendLine('  <title>Pulsagi Articles</title>')
[void]$feedBuilder.AppendLine('  <subtitle>Recent AI, Salesforce, and engineering articles from Pulsagi.</subtitle>')
[void]$feedBuilder.AppendLine('  <id>https://pulsagi.com/articles/feed.xml</id>')
[void]$feedBuilder.AppendLine('  <link href="https://pulsagi.com/articles/feed.xml" rel="self" />')
[void]$feedBuilder.AppendLine('  <link href="https://pulsagi.com/articles/" rel="alternate" />')
[void]$feedBuilder.AppendLine('  <updated>' + $feedUpdated + '</updated>')

foreach ($entry in $sortedEntries) {
  $publishedIso = $entry.Published + "T00:00:00+05:30"
  $modifiedIso = $entry.Modified + "T00:00:00+05:30"

  [void]$feedBuilder.AppendLine('  <entry>')
  [void]$feedBuilder.AppendLine('    <title>' + (Encode-Xml $entry.Title) + '</title>')
  [void]$feedBuilder.AppendLine('    <link href="' + (Encode-Xml $entry.Canonical) + '" />')
  [void]$feedBuilder.AppendLine('    <id>' + (Encode-Xml $entry.Canonical) + '</id>')
  [void]$feedBuilder.AppendLine('    <published>' + $publishedIso + '</published>')
  [void]$feedBuilder.AppendLine('    <updated>' + $modifiedIso + '</updated>')
  [void]$feedBuilder.AppendLine('    <summary>' + (Encode-Xml $entry.Description) + '</summary>')
  [void]$feedBuilder.AppendLine('  </entry>')
}

[void]$feedBuilder.AppendLine('</feed>')
[System.IO.File]::WriteAllText($feedPath, $feedBuilder.ToString(), (New-Object System.Text.UTF8Encoding($false)))

[xml]$sitemap = Get-Content $sitemapPath -Raw
$ns = New-Object System.Xml.XmlNamespaceManager($sitemap.NameTable)
$ns.AddNamespace("sm", "http://www.sitemaps.org/schemas/sitemap/0.9")

foreach ($urlNode in $sitemap.SelectNodes("//sm:url", $ns)) {
  $locNode = $urlNode.SelectSingleNode("sm:loc", $ns)
  $lastModNode = $urlNode.SelectSingleNode("sm:lastmod", $ns)
  if ($null -eq $locNode -or $null -eq $lastModNode) {
    continue
  }

  if (
    $locNode.InnerText -eq "https://pulsagi.com/" -or
    $locNode.InnerText -eq "https://pulsagi.com/articles/" -or
    $locNode.InnerText -like "https://pulsagi.com/articles/*.html"
  ) {
    $lastModNode.InnerText = $today
  }
}

$settings = New-Object System.Xml.XmlWriterSettings
$settings.Indent = $true
$settings.Encoding = New-Object System.Text.UTF8Encoding($false)
$writer = [System.Xml.XmlWriter]::Create($sitemapPath, $settings)
$sitemap.Save($writer)
$writer.Close()
