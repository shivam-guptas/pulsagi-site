const primaryKeywords = [
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

function uppercaseKeywords(value: string) {
  let output = value;

  for (const keyword of primaryKeywords.sort((left, right) => right.length - left.length)) {
    const pattern = new RegExp(keyword.replace(/\s+/g, "\\s+"), "gi");
    output = output.replace(pattern, keyword);
  }

  return output.replace(/\b(and|or|in|not|nulls first|nulls last|asc|desc)\b/gi, (match) =>
    match.toUpperCase()
  );
}

export function formatSoql(source: string) {
  if (!source.trim()) {
    return {
      ok: false as const,
      error: "Paste a SOQL query before formatting."
    };
  }

  const normalized = uppercaseKeywords(
    source.replace(/\s+/g, " ").replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").trim()
  );

  let working = normalized;
  for (const keyword of primaryKeywords.sort((left, right) => right.length - left.length)) {
    const pattern = new RegExp(`\\s${keyword.replace(/\s+/g, "\\s+")}\\b`, "g");
    working = working.replace(pattern, `\n${keyword}`);
  }

  working = working.replace(/,\s*/g, ",\n  ");

  const lines = working
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let depth = 0;
  const formatted = lines.map((line) => {
    const current = `${"  ".repeat(depth)}${line}`;
    const openCount = (line.match(/\(/g) || []).length;
    const closeCount = (line.match(/\)/g) || []).length;
    depth = Math.max(depth + openCount - closeCount, 0);
    return current;
  });

  return {
    ok: true as const,
    output: formatted.join("\n")
  };
}
