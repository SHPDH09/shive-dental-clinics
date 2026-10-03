import { ensureServiceCategorySlug } from "@/lib/service-category-slug";
import { z } from "zod";

export const appointmentPublicSchema = z.object({
  patientName: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  email: z.string().trim().min(1, "Email is required for confirmation").email("Valid email required"),
  doctorId: z.string().optional(),
  branchId: z.string().optional(),
  treatmentName: z.string().min(1, "Select a treatment"),
  serviceId: z.string().optional(),
  appointmentDate: z.string().min(1, "Date is required"),
  appointmentTime: z.string().min(1, "Time is required"),
  message: z.string().max(1000).optional(),
  visitorId: z.string().min(8).max(64).optional(),
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
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL", "IN_APP"]).optional(),
  category: z
    .enum([
      "APPOINTMENT",
      "REMINDER",
      "FOLLOW_UP",
      "ENQUIRY",
      "PAYMENT",
      "TREATMENT",
      "WELCOME",
      "MARKETING",
      "GENERAL",
    ])
    .optional(),
  variables: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export const loginSchema = z.object({
  loginId: z.string().min(3, "Admin ID is required"),
  password: z.string().min(6),
});

export const patientConsentSchema = z.object({
  treatment: z.boolean().optional(),
  communication: z.boolean().optional(),
  whatsApp: z.boolean().optional(),
  email: z.boolean().optional(),
  patientPhotos: z.boolean().optional(),
  beforeAfter: z.boolean().optional(),
  marketing: z.boolean().optional(),
  consentDate: z.string().optional(),
});

export const patientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email().optional().or(z.literal("")),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  profilePhoto: z.string().max(2000).optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  preferredBranchId: z.string().optional(),
  assignedDoctorId: z.string().optional(),
  commWhatsApp: z.boolean().optional(),
  commPhone: z.boolean().optional(),
  commEmail: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "FOLLOW_UP_REQUIRED", "ARCHIVED"]).optional(),
  medicalNotes: z.string().optional(),
  treatmentHistory: z.string().optional(),
  allergies: z.string().optional(),
  dentalHistory: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  followUpInstructions: z.string().optional(),
  examinationNotes: z.string().optional(),
  consent: patientConsentSchema.optional(),
  forceCreate: z.boolean().optional(),
});

export const leadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10),
  whatsAppNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  age: z.number().int().min(0).max(120).optional(),
  source: z.string(),
  sourceCustom: z.string().optional(),
  interestedService: z.string().optional(),
  preferredBranchId: z.string().optional(),
  preferredDoctorId: z.string().optional(),
  status: z
    .enum([
      "NEW",
      "CONTACTED",
      "FOLLOW_UP",
      "INTERESTED",
      "APPOINTMENT_BOOKED",
      "CONVERTED",
      "LOST",
    ])
    .optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  followUpDate: z.string().optional(),
  followUpTime: z.string().optional(),
  notes: z.string().optional(),
  assignedStaff: z.string().optional(),
  lastContactAt: z.string().optional(),
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
  name: z.string().min(2, "Branch name must be at least 2 characters"),
  slug: z.string().optional(),
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

export const serviceCategorySchema = z
  .object({
    name: z.string().min(2, "Category name must be at least 2 characters"),
    slug: z.string().optional().nullable(),
    sortOrder: z.coerce.number().optional(),
  })
  .transform((data) => ({
    name: data.name.trim(),
    slug: ensureServiceCategorySlug(data.name, data.slug),
    sortOrder: data.sortOrder ?? 0,
  }));

const adminPasswordSchema = z
  .string()
  .min(8, "Password at least 8 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");

const adminPhoneSchema = z
  .string()
  .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number")
  .optional()
  .or(z.literal(""));

export const adminCreateSchema = z
  .object({
    loginId: z
      .string()
      .min(4, "Admin ID at least 4 characters")
      .max(32)
      .regex(/^[A-Za-z0-9]+$/, "Admin ID: letters and numbers only")
      .optional(),
    name: z.string().min(2, "Full name is required"),
    email: z.string().email("Valid email is required"),
    phone: z
      .string()
      .min(10)
      .regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid Indian mobile number"),
    profilePhotoUrl: z.string().url().optional().or(z.literal("")),
    password: adminPasswordSchema,
    confirmPassword: z.string().min(8),
    role: z.enum(["SUPER_ADMIN", "MANAGER", "RECEPTIONIST", "STAFF"]).default("RECEPTIONIST"),
    branchId: z.string().optional().nullable(),
    active: z.boolean().default(true),
    permissions: z.record(z.string(), z.record(z.string(), z.boolean())).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const adminResetPasswordSchema = z
  .object({
    password: adminPasswordSchema,
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
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
  phone: adminPhoneSchema,
  profilePhotoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  password: adminPasswordSchema.optional(),
  role: z.enum(["SUPER_ADMIN", "MANAGER", "RECEPTIONIST", "STAFF"]).optional(),
  branchId: z.string().optional().nullable(),
  active: z.boolean().optional(),
  permissions: z.record(z.string(), z.record(z.string(), z.boolean())).optional().nullable(),
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

const profilePhotoUrlSchema = z.preprocess(
  (val) => (val === "" ? null : val),
  z
    .union([z.string().url(), z.string().regex(/^\//), z.null()])
    .optional(),
);

const profilePhoneSchema = z.preprocess(
  (val) => {
    if (val == null || val === "") return null;
    return String(val).replace(/[\s-]/g, "");
  },
  z
    .union([
      z.null(),
      z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
    ])
    .optional(),
);

export const adminProfileUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: profilePhoneSchema,
  profilePhotoUrl: profilePhotoUrlSchema,
});

export const adminChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    password: adminPasswordSchema,
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
