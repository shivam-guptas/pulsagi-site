const controlKeywords = ["if", "else", "for", "while", "try", "catch", "switch"];

function normalizeWhitespace(source: string) {
  return source
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\s*([=+\-/*<>!?:,])\s*/g, " $1 ")
    .replace(/\s+\)/g, ")")
    .replace(/\(\s+/g, "(")
    .replace(/,\s*/g, ", ")
    .trim();
}

export function formatApex(source: string) {
  if (!source.trim()) {
    return {
      ok: false as const,
      error: "Paste Apex code before formatting."
    };
  }

  const normalized = normalizeWhitespace(source)
    .replace(/\{/g, "{\n")
    .replace(/\}/g, "\n}\n")
    .replace(/;/g, ";\n")
    .replace(/\n{3,}/g, "\n\n");

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let indent = 0;
  const formatted = lines.map((line) => {
    if (line.startsWith("}")) {
      indent = Math.max(indent - 1, 0);
    }

    const cleaned = line
      .replace(/\s+([),.;])/g, "$1")
      .replace(/([({])\s+/g, "$1")
      .replace(/\s+\{/g, " {")
      .replace(/\belse if\b/g, "else if");

    const currentLine = `${"  ".repeat(indent)}${cleaned}`;

    const opensBlock =
      cleaned.endsWith("{") ||
      controlKeywords.some((keyword) => cleaned.startsWith(`${keyword} `) && cleaned.includes("{"));

    if (opensBlock && !cleaned.startsWith("}")) {
      indent += 1;
    }

    return currentLine;
  });

  return {
    ok: true as const,
    output: formatted.join("\n").replace(/\n{3,}/g, "\n\n")
  };
}
