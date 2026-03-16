import { describe, expect, it } from "vitest";

import { formatApex } from "@/lib/formatters/apex";
import { formatJson } from "@/lib/formatters/json";
import { formatSoql } from "@/lib/formatters/soql";

describe("formatter utilities", () => {
  it("formats JSON with indentation", () => {
    const result = formatJson('{"name":"Lightning Studio","active":true}');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain('\n  "name": "Lightning Studio"');
    }
  });

  it("formats Apex with block indentation", () => {
    const result = formatApex("public class Demo{public void run(){if(true){System.debug('x');}}}");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("public class Demo {");
      expect(result.output).toContain("  public void run()");
    }
  });

  it("formats SOQL with major clauses on separate lines", () => {
    const result = formatSoql("select Id, Name from Account where Name != null order by Name desc");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("SELECT");
      expect(result.output).toContain("\nFROM");
      expect(result.output).toContain("\nWHERE");
    }
  });
});
