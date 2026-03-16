export type GovernorFinding = {
  id: string;
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
  suggestion: string;
  evidence: string;
};

function addFinding(
  findings: GovernorFinding[],
  finding: Omit<GovernorFinding, "id">
) {
  findings.push({
    id: `${finding.category}-${findings.length + 1}`,
    ...finding
  });
}

export function analyzeGovernorRisks(source: string) {
  const findings: GovernorFinding[] = [];

  if (/for\s*\([^)]*\)\s*\{[\s\S]{0,300}\[[\s\S]{0,200}select\b/i.test(source)) {
    addFinding(findings, {
      severity: "high",
      category: "SOQL in loop",
      message: "Detected a likely SOQL query inside a loop.",
      suggestion: "Move queries outside the loop and bulk-load records into a map.",
      evidence: "Pattern match: loop body contains a SELECT expression."
    });
  }

  if (/for\s*\([^)]*\)\s*\{[\s\S]{0,300}\b(insert|update|upsert|delete)\b/i.test(source)) {
    addFinding(findings, {
      severity: "high",
      category: "DML in loop",
      message: "Detected possible DML inside a loop.",
      suggestion: "Collect records and perform one bulk DML call after iteration.",
      evidence: "Pattern match: loop body contains insert/update/upsert/delete."
    });
  }

  if ((source.match(/System\.debug/gi) || []).length > 8) {
    addFinding(findings, {
      severity: "low",
      category: "Debug volume",
      message: "Large volume of debug statements detected.",
      suggestion: "Reduce debug logging in production paths to protect CPU and log size.",
      evidence: `Found ${(source.match(/System\.debug/gi) || []).length} System.debug statements.`
    });
  }

  if ((source.match(/\bSELECT\b/gi) || []).length > 15) {
    addFinding(findings, {
      severity: "medium",
      category: "Query density",
      message: "High number of SOQL statements detected.",
      suggestion: "Review whether multiple queries can be consolidated or cached.",
      evidence: `Found ${(source.match(/\bSELECT\b/gi) || []).length} SELECT keywords.`
    });
  }

  if (/Trigger\.new(?!Map)/.test(source) && !/Trigger\.newMap/.test(source) && /before update|after update/i.test(source)) {
    addFinding(findings, {
      severity: "medium",
      category: "Trigger data access",
      message: "Update trigger logic may be relying on Trigger.new without map-based lookups.",
      suggestion: "Consider Trigger.newMap and oldMap when diffing records or joining related data.",
      evidence: "Trigger.new usage detected without Trigger.newMap."
    });
  }

  if (/Database\.query\s*\(/.test(source) && !/String\.escapeSingleQuotes/.test(source)) {
    addFinding(findings, {
      severity: "medium",
      category: "Dynamic SOQL safety",
      message: "Dynamic SOQL detected without obvious escaping.",
      suggestion: "Use bind variables or escape user-controlled values before composing query strings.",
      evidence: "Database.query() detected."
    });
  }

  if (!findings.length) {
    addFinding(findings, {
      severity: "low",
      category: "No obvious issue",
      message: "No high-confidence governor problems were detected from current rules.",
      suggestion: "Still review bulkification, query selectivity, and test with realistic batch sizes.",
      evidence: "Rule-based analyzer did not find SOQL/DML-in-loop or high query density patterns."
    });
  }

  return findings;
}
