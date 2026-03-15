function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(payload));
}

function normalizeDomain(value) {
  const input = String(value || "").trim().toLowerCase();
  if (!input) return "";

  let hostname = input;
  try {
    const url = new URL(/^[a-z]+:\/\//.test(input) ? input : "https://" + input);
    hostname = url.hostname.toLowerCase();
  } catch (error) {
    hostname = input.replace(/^www\./, "");
  }

  hostname = hostname.replace(/^www\./, "");
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(hostname)) return "";
  if (hostname.includes("..")) return "";
  return hostname;
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }
  return req.body;
}

async function lookupVirusTotal(domain, apiKey) {
  const response = await fetch("https://www.virustotal.com/api/v3/domains/" + encodeURIComponent(domain), {
    headers: { "x-apikey": apiKey }
  });

  if (!response.ok) {
    return {
      source: "VirusTotal",
      available: false,
      summary: "VirusTotal lookup failed with status " + response.status + "."
    };
  }

  const payload = await response.json();
  const stats = payload && payload.data && payload.data.attributes
    ? payload.data.attributes.last_analysis_stats || {}
    : {};

  const malicious = Number(stats.malicious || 0);
  const suspicious = Number(stats.suspicious || 0);
  const harmless = Number(stats.harmless || 0);
  const undetected = Number(stats.undetected || 0);

  let status = "clean";
  if (malicious > 0) status = "malicious";
  else if (suspicious > 0) status = "review";

  return {
    source: "VirusTotal",
    available: true,
    status,
    summary: "VirusTotal signals - malicious: " + malicious + ", suspicious: " + suspicious + ", harmless: " + harmless + ", undetected: " + undetected + "."
  };
}

async function lookupSafeBrowsing(domain, apiKey) {
  const body = {
    client: {
      clientId: "pulsagi-scam-checker",
      clientVersion: "1.0.0"
    },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION"
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [
        { url: "https://" + domain + "/" },
        { url: "http://" + domain + "/" }
      ]
    }
  };

  const response = await fetch("https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + encodeURIComponent(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    return {
      source: "Google Safe Browsing",
      available: false,
      summary: "Safe Browsing lookup failed with status " + response.status + "."
    };
  }

  const payload = await response.json();
  const matches = Array.isArray(payload.matches) ? payload.matches : [];
  if (!matches.length) {
    return {
      source: "Google Safe Browsing",
      available: true,
      status: "clean",
      summary: "No Safe Browsing threat match was found."
    };
  }

  return {
    source: "Google Safe Browsing",
    available: true,
    status: "malicious",
    summary: "Safe Browsing matched " + matches.length + " threat record(s)."
  };
}

function combineSignals(domain, signals) {
  const availableSignals = signals.filter((signal) => signal.available);
  const reasons = signals.map((signal) => signal.summary).filter(Boolean);

  let status = "unknown";
  if (availableSignals.some((signal) => signal.status === "malicious")) status = "malicious";
  else if (availableSignals.some((signal) => signal.status === "review")) status = "review";
  else if (availableSignals.some((signal) => signal.status === "clean")) status = "clean";

  const provider = availableSignals.length
    ? availableSignals.map((signal) => signal.source).join(" + ")
    : "No live provider configured";

  let summary = "No live domain reputation provider is configured.";
  if (status === "malicious") summary = "At least one provider marked this domain as unsafe.";
  else if (status === "review") summary = "A provider returned a suspicious signal and the domain should be reviewed carefully.";
  else if (status === "clean") summary = "No live provider warning was found for this domain.";

  return {
    domain,
    status,
    provider,
    summary,
    reasons
  };
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
    json(res, 405, { error: "Method not allowed." });
    return;
  }

  const body = parseBody(req);
  const queryDomains = typeof req.query?.domains === "string" ? req.query.domains.split(",") : [];
  const bodyDomains = Array.isArray(body.domains) ? body.domains : [];
  const domains = Array.from(new Set([...queryDomains, ...bodyDomains].map(normalizeDomain).filter(Boolean))).slice(0, 6);

  if (!domains.length) {
    json(res, 400, { error: "Provide at least one valid domain." });
    return;
  }

  const vtKey = process.env.VIRUSTOTAL_API_KEY;
  const gsbKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  const results = [];
  for (const domain of domains) {
    const signals = [];
    if (vtKey) signals.push(await lookupVirusTotal(domain, vtKey));
    if (gsbKey) signals.push(await lookupSafeBrowsing(domain, gsbKey));
    results.push(combineSignals(domain, signals));
  }

  json(res, 200, {
    providers: {
      virustotal: Boolean(vtKey),
      googleSafeBrowsing: Boolean(gsbKey)
    },
    results
  });
};
