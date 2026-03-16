(function () {
  function inspectLog(content, filterText) {
    const lines = content.split(/\r?\n/).filter(Boolean);
    const normalizedFilter = (filterText || "").trim().toLowerCase();
    const filteredLines = normalizedFilter
      ? lines.filter((line) => line.toLowerCase().includes(normalizedFilter))
      : lines;
    const suspiciousTokens = [
      "FATAL_ERROR",
      "EXCEPTION_THROWN",
      "System.LimitException",
      "VALIDATION_ERROR",
      "CALLOUT_EXCEPTION",
      "CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY"
    ];

    return {
      lineCount: lines.length,
      soqlCount: lines.filter((line) => line.includes("SOQL_EXECUTE_BEGIN")).length,
      dmlCount: lines.filter((line) => line.includes("DML_BEGIN")).length,
      exceptionCount: lines.filter(
        (line) => line.includes("EXCEPTION_") || line.includes("FATAL_ERROR")
      ).length,
      limitSignals: lines.filter(
        (line) =>
          line.includes("LIMIT_USAGE_FOR_NS") ||
          line.includes("Number of SOQL queries") ||
          line.includes("Maximum CPU time")
      ).length,
      suspiciousEvents: lines.filter((line) =>
        suspiciousTokens.some((token) => line.includes(token))
      ),
      filteredLines
    };
  }

  function analyzeGovernorRisks(source) {
    const findings = [];

    function pushFinding(finding) {
      findings.push({ id: `${finding.category}-${findings.length + 1}`, ...finding });
    }

    if (/for\s*\([^)]*\)\s*\{[\s\S]{0,300}\[[\s\S]{0,200}select\b/i.test(source)) {
      pushFinding({
        severity: "high",
        category: "SOQL in loop",
        message: "Detected a likely SOQL query inside a loop.",
        suggestion: "Move queries outside the loop and bulk-load records into a map.",
        evidence: "Pattern match: loop body contains a SELECT expression."
      });
    }

    if (/for\s*\([^)]*\)\s*\{[\s\S]{0,300}\b(insert|update|upsert|delete)\b/i.test(source)) {
      pushFinding({
        severity: "high",
        category: "DML in loop",
        message: "Detected possible DML inside a loop.",
        suggestion: "Collect records and perform one bulk DML call after iteration.",
        evidence: "Pattern match: loop body contains insert, update, upsert, or delete."
      });
    }

    const debugCount = (source.match(/System\.debug/gi) || []).length;
    if (debugCount > 8) {
      pushFinding({
        severity: "low",
        category: "Debug volume",
        message: "Large volume of debug statements detected.",
        suggestion: "Reduce debug logging in production paths to protect CPU and log size.",
        evidence: `Found ${debugCount} System.debug statements.`
      });
    }

    const selectCount = (source.match(/\bSELECT\b/gi) || []).length;
    if (selectCount > 15) {
      pushFinding({
        severity: "medium",
        category: "Query density",
        message: "High number of SOQL statements detected.",
        suggestion: "Review whether multiple queries can be consolidated or cached.",
        evidence: `Found ${selectCount} SELECT keywords.`
      });
    }

    if (/Database\.query\s*\(/.test(source) && !/String\.escapeSingleQuotes/.test(source)) {
      pushFinding({
        severity: "medium",
        category: "Dynamic SOQL safety",
        message: "Dynamic SOQL detected without obvious escaping.",
        suggestion: "Use bind variables or escape user-controlled values before composing query strings.",
        evidence: "Database.query() detected."
      });
    }

    if (!findings.length) {
      pushFinding({
        severity: "low",
        category: "No obvious issue",
        message: "No high-confidence governor problems were detected from current rules.",
        suggestion: "Still review bulkification, query selectivity, and realistic batch sizes.",
        evidence: "Rule-based analyzer did not find SOQL-in-loop or DML-in-loop patterns."
      });
    }

    return findings;
  }

  function buildLcsTable(leftLines, rightLines) {
    const table = Array.from({ length: leftLines.length + 1 }, () =>
      Array(rightLines.length + 1).fill(0)
    );

    for (let leftIndex = leftLines.length - 1; leftIndex >= 0; leftIndex -= 1) {
      for (let rightIndex = rightLines.length - 1; rightIndex >= 0; rightIndex -= 1) {
        table[leftIndex][rightIndex] =
          leftLines[leftIndex] === rightLines[rightIndex]
            ? table[leftIndex + 1][rightIndex + 1] + 1
            : Math.max(table[leftIndex + 1][rightIndex], table[leftIndex][rightIndex + 1]);
      }
    }

    return table;
  }

  function diffText(leftValue, rightValue) {
    const leftLines = leftValue.split(/\r?\n/);
    const rightLines = rightValue.split(/\r?\n/);
    const table = buildLcsTable(leftLines, rightLines);
    const parts = [];

    let leftIndex = 0;
    let rightIndex = 0;
    while (leftIndex < leftLines.length && rightIndex < rightLines.length) {
      if (leftLines[leftIndex] === rightLines[rightIndex]) {
        parts.push({ type: "same", left: leftLines[leftIndex], right: rightLines[rightIndex] });
        leftIndex += 1;
        rightIndex += 1;
      } else if (table[leftIndex + 1][rightIndex] >= table[leftIndex][rightIndex + 1]) {
        parts.push({ type: "removed", left: leftLines[leftIndex], right: "" });
        leftIndex += 1;
      } else {
        parts.push({ type: "added", left: "", right: rightLines[rightIndex] });
        rightIndex += 1;
      }
    }

    while (leftIndex < leftLines.length) {
      parts.push({ type: "removed", left: leftLines[leftIndex], right: "" });
      leftIndex += 1;
    }

    while (rightIndex < rightLines.length) {
      parts.push({ type: "added", left: "", right: rightLines[rightIndex] });
      rightIndex += 1;
    }

    return parts;
  }

  window.LightningStudioAnalysis = {
    inspectLog,
    analyzeGovernorRisks,
    diffText
  };
})();
