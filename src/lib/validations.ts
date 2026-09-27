import { z } from "zod";

export const appointmentPublicSchema = z.object({
  patientName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().email("Valid email required").optional().or(z.literal("")),
  doctorId: z.string().optional(),
  branchId: z.string().optional(),
  treatmentName: z.string().min(1, "Select a treatment"),
  serviceId: z.string().optional(),
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
  message: z.string().max(1000).optional(),
});

const dayScheduleSchema = z.object({
  enabled: z.boolean(),
  start: z.string().min(1),
  end: z.string().min(1),
});

export const doctorSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  qualification: z.string().min(2),
  specialization: z.string().min(2),
  experienceYears: z.number().int().min(0),
  bio: z.string().min(20),
  summary: z.string().min(10),
  image: z.string().min(1, "Profile photo is required"),
  areasOfExpertise: z.array(z.string().min(1)).optional(),
  languagesSpoken: z.string().optional(),
  weeklySchedule: z
    .object({
      monday: dayScheduleSchema,
      tuesday: dayScheduleSchema,
      wednesday: dayScheduleSchema,
      thursday: dayScheduleSchema,
      friday: dayScheduleSchema,
      saturday: dayScheduleSchema,
      sunday: dayScheduleSchema,
    })
    .optional(),
  consultationHours: z.string().optional(),
  registrationNumber: z.string().optional(),
  phone: z.string().optional(),
  featured: z.boolean().optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const enquirySchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  subject: z.string().min(2).max(200).optional(),
  message: z.string().min(10, "Please enter your message").max(5000),
  website: z.string().max(0).optional(),
});

export const enquiryAdminPatchSchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "REPLIED", "CLOSED"]).optional(),
  important: z.boolean().optional(),
  assignedStaff: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  source: z
    .enum(["WEBSITE", "APPOINTMENT", "WHATSAPP", "PHONE", "GOOGLE", "INSTAGRAM", "FACEBOOK", "REFERRAL", "OTHER"])
    .optional(),
});

export const enquiryReplySchema = z.object({
  subject: z.string().min(2),
  message: z.string().min(2),
  sentBy: z.string().optional(),
});

export const messageTemplateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  subject: z.string().min(2),
  body: z.string().min(10),
  sortOrder: z.number().optional(),
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

const serviceFaqSchema = z.object({
  question: z.string().min(2),
  answer: z.string().min(2),
});

export const serviceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  description: z.string().min(10),
  shortDesc: z.string().min(5),
  whatIsTreatment: z.string().optional(),
  image: z.string().min(1, "Service image is required"),
  icon: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  treatmentDuration: z.string().optional(),
  price: z.string().optional(),
  hidePrice: z.boolean().optional(),
  benefits: z.array(z.string().min(1)).optional(),
  treatmentSteps: z.array(z.string().min(1)).optional(),
  faqs: z.array(serviceFaqSchema).optional(),
  featured: z.boolean().optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const dayScheduleSchemaBranch = z.object({
  enabled: z.boolean(),
  start: z.string().min(1),
  end: z.string().min(1),
});

export const branchSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  image: z.string().optional(),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  phone: z.string().min(8),
  whatsapp: z.string().optional(),
  mapUrl: z.string().optional(),
  mapEmbedUrl: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  weeklySchedule: z
    .object({
      monday: dayScheduleSchemaBranch,
      tuesday: dayScheduleSchemaBranch,
      wednesday: dayScheduleSchemaBranch,
      thursday: dayScheduleSchemaBranch,
      friday: dayScheduleSchemaBranch,
      saturday: dayScheduleSchemaBranch,
      sunday: dayScheduleSchemaBranch,
    })
    .optional(),
  openTime: z.string().optional(),
  closeTime: z.string().optional(),
  offDays: z.string().optional(),
  doctorIds: z.array(z.string()).optional(),
  serviceIds: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  status: z.enum(["ACTIVE", "CLOSED"]).optional(),
  sortOrder: z.number().optional(),
});

export const serviceCategorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
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

export const beforeAfterSchema = z.object({
  caseName: z.string().min(2, "Case name is required"),
  beforeImage: z.string().min(1, "Before image is required"),
  afterImage: z.string().min(1, "After image is required"),
  treatment: z.string().min(2, "Treatment is required"),
  category: z.enum([
    "teeth-whitening",
    "smile-makeover",
    "root-canal",
    "dental-implants",
    "orthodontic",
    "dental-restoration",
    "cosmetic-dentistry",
  ]),
  treatmentDuration: z.string().max(120).optional().or(z.literal("")),
  description: z.string().max(2000).optional().or(z.literal("")),
  caseDate: z.string().optional(),
  verifiedCase: z.boolean().default(true),
  consentConfirmed: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  featured: z.boolean().default(false),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  sortOrder: z.coerce.number().int().optional(),
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
