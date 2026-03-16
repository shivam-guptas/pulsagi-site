export type LogSummary = {
  lineCount: number;
  soqlCount: number;
  dmlCount: number;
  exceptionCount: number;
  limitSignals: number;
  suspiciousEvents: string[];
  filteredLines: string[];
};

const suspiciousTokens = [
  "FATAL_ERROR",
  "EXCEPTION_THROWN",
  "System.LimitException",
  "VALIDATION_ERROR",
  "CALLOUT_EXCEPTION",
  "CANNOT_INSERT_UPDATE_ACTIVATE_ENTITY"
];

export function inspectLog(content: string, filter = ""): LogSummary {
  const lines = content.split(/\r?\n/).filter(Boolean);
  const normalizedFilter = filter.trim().toLowerCase();
  const filteredLines = normalizedFilter
    ? lines.filter((line) => line.toLowerCase().includes(normalizedFilter))
    : lines;

  const suspiciousEvents = lines.filter((line) =>
    suspiciousTokens.some((token) => line.includes(token))
  );

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
    suspiciousEvents,
    filteredLines
  };
}
