/** First human-readable message from a Zod validation error. */
export function firstZodFieldError(error: { flatten: () => { fieldErrors: Record<string, string[]> } }): string {
  const flat = error.flatten().fieldErrors;
  const first = Object.values(flat).flat()[0];
  return first ?? "Invalid data";
}

/** Turn API `{ error: string | Zod flatten | unknown }` into display text. */
export function messageFromApiErrorField(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object") {
    const o = error as {
      fieldErrors?: Record<string, string[]>;
      formErrors?: string[];
      message?: string;
    };
    if (typeof o.message === "string" && o.message.trim()) return o.message;
    if (o.formErrors?.length) return o.formErrors[0]!;
    if (o.fieldErrors) {
      const first = Object.values(o.fieldErrors).flat()[0];
      if (first) return first;
    }
  }
  return "Request failed";
}
