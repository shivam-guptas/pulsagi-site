(function () {
  function readStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Unable to write local storage", error);
    }
  }

  async function copyText(value) {
    await navigator.clipboard.writeText(value);
  }

  function downloadText(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatJson(input, compact) {
    try {
      const parsed = JSON.parse(input);
      return { ok: true, output: JSON.stringify(parsed, null, compact ? 0 : 2) };
    } catch (error) {
      return { ok: false, error: error.message || "Invalid JSON input." };
    }
  }

  function formatApex(source) {
    if (!source.trim()) {
      return { ok: false, error: "Paste Apex code before formatting." };
    }

    const normalized = source
      .replace(/\r\n/g, "\n")
      .replace(/\t/g, "  ")
      .replace(/[ ]{2,}/g, " ")
      .replace(/\s*([=+\-/*<>!?:,])\s*/g, " $1 ")
      .replace(/\s+\)/g, ")")
      .replace(/\(\s+/g, "(")
      .replace(/,\s*/g, ", ")
      .trim()
      .replace(/\{/g, "{\n")
      .replace(/\}/g, "\n}\n")
      .replace(/;/g, ";\n")
      .replace(/\n{3,}/g, "\n\n");

    const lines = normalized
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let indent = 0;
    const output = lines
      .map((line) => {
        if (line.startsWith("}")) {
          indent = Math.max(indent - 1, 0);
        }

        const cleaned = line
          .replace(/\s+([),.;])/g, "$1")
          .replace(/([({])\s+/g, "$1")
          .replace(/\s+\{/g, " {")
          .replace(/\belse if\b/g, "else if");

        const current = `${"  ".repeat(indent)}${cleaned}`;
        if (cleaned.endsWith("{") && !cleaned.startsWith("}")) {
          indent += 1;
        }

        return current;
      })
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");

    return { ok: true, output };
  }

  function formatSoql(source) {
    if (!source.trim()) {
      return { ok: false, error: "Paste a SOQL query before formatting." };
    }

    const keywords = [
      "SELECT",
      "FROM",
      "WHERE",
      "GROUP BY",
      "ORDER BY",
      "HAVING",
      "LIMIT",
      "OFFSET",
      "TYPEOF",
      "WHEN",
      "ELSE",
      "END",
      "WITH",
      "USING SCOPE"
    ];

    let working = source
      .replace(/\s+/g, " ")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .trim();

    keywords
      .slice()
      .sort((left, right) => right.length - left.length)
      .forEach((keyword) => {
        const pattern = new RegExp(keyword.replace(/\s+/g, "\\s+"), "gi");
        working = working.replace(pattern, keyword);
      });

    working = working.replace(
      /\b(and|or|in|not|nulls first|nulls last|asc|desc)\b/gi,
      (match) => match.toUpperCase()
    );

    keywords
      .slice()
      .sort((left, right) => right.length - left.length)
      .forEach((keyword) => {
        const pattern = new RegExp(`\\s${keyword.replace(/\s+/g, "\\s+")}\\b`, "g");
        working = working.replace(pattern, `\n${keyword}`);
      });

    working = working.replace(/,\s*/g, ",\n  ");

    let depth = 0;
    const output = working
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const current = `${"  ".repeat(depth)}${line}`;
        depth = Math.max(
          depth + (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length,
          0
        );
        return current;
      })
      .join("\n");

    return { ok: true, output };
  }

  function formatXmlNode(node, depth) {
    const indent = "  ".repeat(depth);
    const children = Array.from(node.children || []);
    const attributes = Array.from(node.attributes || [])
      .map((attribute) => `${attribute.name}="${attribute.value}"`)
      .join(" ");
    const startTag = attributes ? `<${node.tagName} ${attributes}>` : `<${node.tagName}>`;
    const text = (node.textContent || "").trim();

    if (!children.length && !text) {
      return `${indent}${startTag.replace(/>$/, " />")}`;
    }

    if (!children.length) {
      return `${indent}${startTag}${text}</${node.tagName}>`;
    }

    const childOutput = children.map((child) => formatXmlNode(child, depth + 1)).join("\n");
    return `${indent}${startTag}\n${childOutput}\n${indent}</${node.tagName}>`;
  }

  function formatXml(source) {
    if (!source.trim()) {
      return { ok: false, error: "Paste XML before formatting." };
    }

    const parser = new DOMParser();
    const documentNode = parser.parseFromString(source, "application/xml");
    const parserError = documentNode.querySelector("parsererror");

    if (parserError) {
      return { ok: false, error: parserError.textContent.trim() || "Malformed XML." };
    }

    return { ok: true, output: formatXmlNode(documentNode.documentElement, 0) };
  }

  function parseHeaderLines(input) {
    const headers = new Headers();

    input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const separatorIndex = line.indexOf(":");
        if (separatorIndex > -1) {
          headers.set(
            line.slice(0, separatorIndex).trim(),
            line.slice(separatorIndex + 1).trim()
          );
        }
      });

    return headers;
  }

  function prettyResponseText(text) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch (error) {
      return text;
    }
  }

  function generateMarkup(options) {
    const sections = [];

    if (options.includeCard) {
      sections.push(`<lightning-card title="${options.title || "Studio Card"}">\n  <div class="slds-p-around_medium">\n    <p>Generated with Lightning Studio.</p>\n  </div>\n</lightning-card>`);
    }
    if (options.includeGrid) {
      sections.push(`<div class="slds-grid slds-wrap slds-gutters">\n  <div class="slds-col slds-size_1-of-2">\n    <lightning-input label="First value"></lightning-input>\n  </div>\n  <div class="slds-col slds-size_1-of-2">\n    <lightning-input label="Second value"></lightning-input>\n  </div>\n</div>`);
    }
    if (options.includeInput) {
      sections.push(`<lightning-input label="Account Name" value={accountName}></lightning-input>`);
    }
    if (options.includeButton) {
      sections.push(`<lightning-button variant="brand" label="Save" onclick={handleSave}></lightning-button>`);
    }
    if (options.includeDatatable) {
      sections.push(`<lightning-datatable\n  key-field="id"\n  data={rows}\n  columns={columns}\n  hide-checkbox-column>\n</lightning-datatable>`);
    }

    return `<template>\n${sections
      .map((section) => `  ${section.replace(/\n/g, "\n  ")}`)
      .join("\n\n")}\n</template>\n`;
  }

  window.LightningStudioUtils = {
    readStorage,
    writeStorage,
    copyText,
    downloadText,
    escapeHtml,
    formatJson,
    formatApex,
    formatSoql,
    formatXml,
    parseHeaderLines,
    prettyResponseText,
    generateMarkup
  };
})();
