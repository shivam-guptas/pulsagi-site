function formatNode(node: Element, depth: number) {
  const indent = "  ".repeat(depth);
  const children = Array.from(node.children);
  const text = node.textContent?.trim() ?? "";
  const attributes = Array.from(node.attributes)
    .map((attribute) => `${attribute.name}="${attribute.value}"`)
    .join(" ");
  const tagStart = attributes ? `<${node.tagName} ${attributes}>` : `<${node.tagName}>`;

  if (!children.length && !text) {
    return `${indent}${tagStart.replace(/>$/, " />")}`;
  }

  if (!children.length) {
    return `${indent}${tagStart}${text}</${node.tagName}>`;
  }

  const childOutput = children.map((child) => formatNode(child, depth + 1)).join("\n");
  return `${indent}${tagStart}\n${childOutput}\n${indent}</${node.tagName}>`;
}

export function formatXml(source: string) {
  if (!source.trim()) {
    return {
      ok: false as const,
      error: "Paste XML before formatting."
    };
  }

  if (typeof DOMParser === "undefined") {
    return {
      ok: false as const,
      error: "XML formatting is unavailable in this runtime."
    };
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(source, "application/xml");
  const parserError = documentNode.querySelector("parsererror");

  if (parserError) {
    return {
      ok: false as const,
      error: parserError.textContent?.trim() || "Malformed XML."
    };
  }

  if (!documentNode.documentElement) {
    return {
      ok: false as const,
      error: "XML does not contain a root element."
    };
  }

  return {
    ok: true as const,
    output: formatNode(documentNode.documentElement, 0)
  };
}
