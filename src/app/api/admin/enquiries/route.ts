import { createCrudHandlers } from "@/lib/crud-route";

export const { GET, POST } = createCrudHandlers("enquiry", {
  searchFields: ["name", "phone", "email", "message"],
});
