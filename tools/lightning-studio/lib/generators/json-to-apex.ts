type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function pascalCase(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

function camelCase(value: string) {
  const result = pascalCase(value);
  return result ? result.charAt(0).toLowerCase() + result.slice(1) : "fieldValue";
}

function singularize(value: string) {
  return value.endsWith("s") ? value.slice(0, -1) : value;
}

function indent(value: string, level = 1) {
  return value
    .split("\n")
    .map((line) => `${"  ".repeat(level)}${line}`)
    .join("\n");
}

function inferScalarType(value: JsonValue) {
  if (typeof value === "string") {
    return "String";
  }

  if (typeof value === "boolean") {
    return "Boolean";
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? "Integer" : "Decimal";
  }

  return "Object";
}

function buildInnerClasses(
  className: string,
  value: Record<string, JsonValue>,
  seen: Set<string>
): string[] {
  const nestedClasses: string[] = [];

  for (const [key, childValue] of Object.entries(value)) {
    if (Array.isArray(childValue)) {
      const firstItem = childValue.find((item) => item !== null);
      if (firstItem && typeof firstItem === "object" && !Array.isArray(firstItem)) {
        const childClassName = pascalCase(singularize(key)) || `${className}Item`;
        if (!seen.has(childClassName)) {
          seen.add(childClassName);
          const childBody = buildObjectMembers(
            childClassName,
            firstItem as Record<string, JsonValue>,
            seen
          );
          nestedClasses.push(
            `public class ${childClassName} {\n${indent(childBody.fields)}${
              childBody.nested.length ? `\n\n${indent(childBody.nested.join("\n\n"))}` : ""
            }\n}`
          );
        }
      }
    } else if (typeof childValue === "object" && childValue !== null) {
      const childClassName = pascalCase(key) || `${className}Details`;
      if (!seen.has(childClassName)) {
        seen.add(childClassName);
        const childBody = buildObjectMembers(
          childClassName,
          childValue as Record<string, JsonValue>,
          seen
        );
        nestedClasses.push(
          `public class ${childClassName} {\n${indent(childBody.fields)}${
            childBody.nested.length ? `\n\n${indent(childBody.nested.join("\n\n"))}` : ""
          }\n}`
        );
      }
    }
  }

  return nestedClasses;
}

function buildObjectMembers(
  className: string,
  value: Record<string, JsonValue>,
  seen: Set<string>
) {
  const fields = Object.entries(value)
    .map(([key, childValue]) => {
      const propertyName = camelCase(key);

      if (Array.isArray(childValue)) {
        const firstItem = childValue.find((item) => item !== null);

        if (!firstItem) {
          return `public List<Object> ${propertyName};`;
        }

        if (typeof firstItem === "object" && !Array.isArray(firstItem)) {
          const childClassName = pascalCase(singularize(key)) || `${className}Item`;
          return `public List<${childClassName}> ${propertyName};`;
        }

        return `public List<${inferScalarType(firstItem)}> ${propertyName};`;
      }

      if (typeof childValue === "object" && childValue !== null) {
        const childClassName = pascalCase(key) || `${className}Details`;
        return `public ${childClassName} ${propertyName};`;
      }

      return `public ${inferScalarType(childValue)} ${propertyName};`;
    })
    .join("\n");

  return {
    fields,
    nested: buildInnerClasses(className, value, seen)
  };
}

export function generateApexFromJson(className: string, input: string) {
  const normalizedClassName = pascalCase(className) || "RootResponse";

  let parsed: JsonValue;
  try {
    parsed = JSON.parse(input) as JsonValue;
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Invalid JSON input."
    };
  }

  if (Array.isArray(parsed)) {
    const firstItem = parsed.find((item) => item !== null);

    if (firstItem && typeof firstItem === "object" && !Array.isArray(firstItem)) {
      const seen = new Set<string>([normalizedClassName]);
      const body = buildObjectMembers(
        normalizedClassName,
        firstItem as Record<string, JsonValue>,
        seen
      );

      return {
        ok: true as const,
        output: `public class ${normalizedClassName} {\n${indent(body.fields)}\n\n  public static List<${normalizedClassName}> parse(String json) {\n    return (List<${normalizedClassName}>) JSON.deserialize(json, List<${normalizedClassName}>.class);\n  }${
          body.nested.length ? `\n\n${indent(body.nested.join("\n\n"))}` : ""
        }\n}`
      };
    }

    return {
      ok: true as const,
      output: `public class ${normalizedClassName} {\n  public ${inferScalarType(firstItem ?? null)} value;\n\n  public static List<${normalizedClassName}> parse(String json) {\n    return (List<${normalizedClassName}>) JSON.deserialize(json, List<${normalizedClassName}>.class);\n  }\n}`
    };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return {
      ok: true as const,
      output: `public class ${normalizedClassName} {\n  public ${inferScalarType(parsed)} value;\n\n  public static ${normalizedClassName} parse(String json) {\n    return (${normalizedClassName}) JSON.deserialize(json, ${normalizedClassName}.class);\n  }\n}`
    };
  }

  const seen = new Set<string>([normalizedClassName]);
  const body = buildObjectMembers(
    normalizedClassName,
    parsed as Record<string, JsonValue>,
    seen
  );

  return {
    ok: true as const,
    output: `public class ${normalizedClassName} {\n${indent(body.fields)}\n\n  public static ${normalizedClassName} parse(String json) {\n    return (${normalizedClassName}) JSON.deserialize(json, ${normalizedClassName}.class);\n  }${
      body.nested.length ? `\n\n${indent(body.nested.join("\n\n"))}` : ""
    }\n}`
  };
}
