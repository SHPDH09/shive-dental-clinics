import { createCrudHandlers } from "@/lib/crud-route";

export const { GET, POST } = createCrudHandlers("branch", {
  searchFields: ["name", "location"],
});
