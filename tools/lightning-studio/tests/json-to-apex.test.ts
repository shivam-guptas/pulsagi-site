import { describe, expect, it } from "vitest";

import { generateApexFromJson } from "@/lib/generators/json-to-apex";

describe("JSON to Apex generator", () => {
  it("creates a root class with nested inner classes", () => {
    const result = generateApexFromJson(
      "AccountPayload",
      JSON.stringify({
        name: "Acme",
        owner: {
          id: "005xx",
          active: true
        },
        contacts: [
          {
            firstName: "Ada"
          }
        ]
      })
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.output).toContain("public class AccountPayload {");
      expect(result.output).toContain("public Owner owner;");
      expect(result.output).toContain("public List<Contact> contacts;");
      expect(result.output).toContain("public class Owner {");
      expect(result.output).toContain("public class Contact {");
      expect(result.output).toContain("public static AccountPayload parse(String json)");
    }
  });

  it("returns an error for invalid JSON", () => {
    const result = generateApexFromJson("BrokenPayload", "{bad json}");

    expect(result.ok).toBe(false);
  });
});
