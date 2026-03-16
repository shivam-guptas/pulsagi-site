import { describe, expect, it } from "vitest";

import { analyzeGovernorRisks } from "@/lib/analyzers/governor";
import { inspectLog } from "@/lib/parsers/log-inspector";

describe("analysis utilities", () => {
  it("parses log summaries from debug log tokens", () => {
    const summary = inspectLog(
      "SOQL_EXECUTE_BEGIN\nDML_BEGIN\nEXCEPTION_THROWN\nLIMIT_USAGE_FOR_NS"
    );

    expect(summary.soqlCount).toBe(1);
    expect(summary.dmlCount).toBe(1);
    expect(summary.exceptionCount).toBe(1);
    expect(summary.limitSignals).toBe(1);
  });

  it("flags SOQL inside loops", () => {
    const findings = analyzeGovernorRisks(
      "for(Account account : Trigger.new){ List<Contact> c = [SELECT Id FROM Contact WHERE AccountId = :account.Id]; }"
    );

    expect(findings.some((finding) => finding.category === "SOQL in loop")).toBe(true);
  });
});
