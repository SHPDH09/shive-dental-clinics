import { createCrudHandlers } from "@/lib/crud-route";

export const { GET, POST } = createCrudHandlers("doctor", {
  searchFields: ["name", "specialization", "qualification"],
});
