/** First human-readable message from a Zod validation error. */
export function firstZodFieldError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): string {
  const flat = error.flatten().fieldErrors;
  const first = Object.values(flat).flat()[0];
  return first ?? "Invalid data";
}
