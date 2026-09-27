import { createCrudHandlers } from "@/lib/crud-route";

export const { GET, POST } = createCrudHandlers("lead", {
  searchFields: ["name", "phone", "email", "interestedService"],
});
