import { z } from "zod";

export const appointmentPublicSchema = z.object({
  patientName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  treatmentName: z.string().min(1, "Select a treatment"),
  serviceId: z.string().optional(),
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
  message: z.string().max(1000).optional(),
});

export const enquirySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  message: z.string().min(10, "Please enter your message"),
});

export const loginSchema = z.object({
  loginId: z.string().min(3, "Admin ID is required"),
  password: z.string().min(6),
});

export const patientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  medicalNotes: z.string().optional(),
  treatmentHistory: z.string().optional(),
});

export const leadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  source: z.string(),
  interestedService: z.string().optional(),
  status: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
  assignedStaff: z.string().optional(),
});

export const serviceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().optional(),
  description: z.string().min(10),
  shortDesc: z.string().optional(),
  image: z.string().optional(),
  price: z.string().optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const adminCreateSchema = z.object({
  loginId: z
    .string()
    .min(4, "Admin ID at least 4 characters")
    .max(32)
    .regex(/^[A-Za-z0-9]+$/, "Admin ID: letters and numbers only"),
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8, "Password at least 8 characters"),
  role: z.enum(["SUPER_ADMIN", "STAFF"]).default("STAFF"),
});

export const videoMediaSchema = z.object({
  title: z.string().min(2, "Video title is required"),
  description: z.string().max(4000).optional().or(z.literal("")),
  mediaUrl: z.string().min(1, "Upload a video file"),
  thumbnailUrl: z.string().min(1, "Upload a thumbnail"),
  category: z.enum([
    "dental-treatments",
    "smile-transformations",
    "doctor-advice",
    "clinic-tour",
    "patient-experiences",
    "clinic-updates",
    "dental-education",
  ]),
  durationSeconds: z.coerce.number().int().min(0).optional(),
  uploadDate: z.string().optional(),
  isPublic: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const galleryMediaSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().max(2000).optional().or(z.literal("")),
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  mediaUrl: z.string().min(1, "Upload a file first"),
  category: z.enum([
    "clinic",
    "doctors-team",
    "treatments",
    "smile-transformations",
    "patient-moments",
    "videos",
  ]),
  isPublic: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
});

export const testimonialSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  patientImage: z.string().max(2048).optional().or(z.literal("")),
  rating: z.coerce.number().int().min(1).max(5),
  treatment: z.string().min(1, "Treatment is required"),
  testimonial: z.string().min(10, "Testimonial is too short"),
  testimonialDate: z.string().optional(),
  verifiedPatient: z.boolean().default(true),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("PUBLISHED"),
});

export const adminUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(8).optional(),
  role: z.enum(["SUPER_ADMIN", "STAFF"]).optional(),
});
