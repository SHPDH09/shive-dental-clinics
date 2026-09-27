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
  email: z.string().email(),
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
