import { createCrudHandlers } from "@/lib/crud-route";

export const { GET, POST } = createCrudHandlers("testimonial", {
  searchFields: ["patientName", "testimonial", "treatment"],
});
