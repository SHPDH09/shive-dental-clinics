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

export const clinicSettingsPatchSchema = z
  .object({
    clinicName: z.string().min(2).optional(),
    tagline: z.string().max(200).optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    faviconUrl: z.string().optional().nullable(),
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pinCode: z.string().optional().nullable(),
    mapEmbedUrl: z.string().optional().nullable(),
    mapLink: z.string().optional().nullable(),
    googleBusinessUrl: z.string().optional().nullable(),
    emergencyContact: z.string().optional().nullable(),
    footerText: z.string().optional().nullable(),
    aboutIntro: z.string().optional().nullable(),
    mission: z.string().optional().nullable(),
    vision: z.string().optional().nullable(),
    whyChooseUs: z.string().optional().nullable(),
    seoTitle: z.string().optional().nullable(),
    seoDescription: z.string().optional().nullable(),
    defaultLanguage: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    showRevenueCard: z.boolean().optional(),
    monthlyRevenue: z.union([z.string(), z.number()]).optional().nullable(),
    openingHours: z.unknown().optional(),
    socialLinks: z.record(z.string(), z.string()).optional(),
    extended: z.record(z.string(), z.unknown()).optional(),
    secrets: z
      .object({
        smtpPassword: z.string().optional(),
        paymentApiKey: z.string().optional(),
        paymentApiSecret: z.string().optional(),
        captchaSecret: z.string().optional(),
        smsApiKey: z.string().optional(),
        storageAccessKey: z.string().optional(),
        storageSecretKey: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();
