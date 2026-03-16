import { safeJsonParse } from "@/lib/utils";

export function formatJson(input: string, compact = false) {
  const result = safeJsonParse<unknown>(input);

  if (result.error) {
    return {
      ok: false as const,
      error: result.error
    };
  }

  return {
    ok: true as const,
    output: JSON.stringify(result.data, null, compact ? 0 : 2)
  };
}
