import { createCrudHandlers } from "@/lib/crud-route";

export const { GET, POST } = createCrudHandlers("beforeAfter", {
  searchFields: ["treatment", "description"],
});
