import { createCrudHandlers } from "@/lib/crud-route";

export const { GET, POST } = createCrudHandlers("media", {
  searchFields: ["title", "description", "category"],
});
