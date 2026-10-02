import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { createPgPool } from "../src/lib/pg-pool";
import {
  DENTAL_CATALOG_CATEGORIES,
  DENTAL_CATALOG_SERVICES,
} from "../src/lib/dental-service-catalog";

const pool = createPgPool(process.env.DATABASE_URL!);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const loginId = process.env.ADMIN_LOGIN_ID ?? "1A74N3077";
  const password = process.env.ADMIN_PASSWORD ?? "Raunak@12583";
  const email = process.env.ADMIN_EMAIL?.trim() || "rk331159@gmail.com";
  const hash = await bcrypt.hash(password, 12);

  await prisma.admin.deleteMany({});
  await prisma.admin.create({
    data: {
      loginId,
      name: "Shiv Dental Admin",
      email,
      passwordHash: hash,
      role: "SUPER_ADMIN",
    },
  });

  const clinicData = {
    clinicName: "Shiv Dental Clinic",
    phone: "+91 9973479904",
    whatsapp: "+91 9973479904",
    emergencyContact: "+91 9973479904",
    email: "info@shivdentalclinic.com",
    address: "Shiv Dental Clinic, SG R Annexe, India",
    logoUrl: "/images/shiv-dental-branding.jpg",
    aboutIntro:
      "Shiv Dental Clinic (शिव डेंटल क्लिनिक) provides trusted oral and dental surgery care with a patient-first approach, modern equipment, and a hygienic environment.",
    mission: "To deliver ethical, painless, and advanced dental treatment for every patient.",
    vision: "Healthy smiles and lasting trust in our community.",
    whyChooseUs:
      "Experienced dental surgeon, registered practice, personalized treatment plans, and affordable care at SG R Annexe.",
    openingHours: {
      weekdays: "Mon – Sat: 9:00 AM – 8:00 PM",
      sunday: "Sun: 10:00 AM – 2:00 PM (Emergency)",
    },
    socialLinks: {},
    footerText: "© Shiv Dental Clinic. All rights reserved.",
    seoTitle: "Shiv Dental Clinic | Oral & Dental Surgeon",
    seoDescription:
      "Shiv Dental Clinic — Dr. Rishikesh Prasad, Oral & Dental Surgeon. Call 9973479904 to book your appointment.",
  };

  await prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: clinicData,
    create: { id: "default", ...clinicData },
  });

  const statCount = await prisma.heroStat.count();
  if (statCount === 0) {
    await prisma.heroStat.createMany({
      data: [
        { label: "Years Experience", value: "10+", sortOrder: 0 },
        { label: "Happy Patients", value: "5,000+", sortOrder: 1 },
        { label: "Dental Treatments", value: "65+", sortOrder: 2 },
        { label: "Patient Rating", value: "4.9/5", sortOrder: 3 },
      ],
    });
  }

  const categoryIds: Record<string, string> = {};
  for (let i = 0; i < DENTAL_CATALOG_CATEGORIES.length; i++) {
    const cat = DENTAL_CATALOG_CATEGORIES[i]!;
    const row = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: i },
      create: { name: cat.name, slug: cat.slug, sortOrder: i },
    });
    categoryIds[cat.slug] = row.id;
  }

  for (let i = 0; i < DENTAL_CATALOG_SERVICES.length; i++) {
    const svc = DENTAL_CATALOG_SERVICES[i]!;
    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {
        name: svc.name,
        description: svc.description,
        shortDesc: svc.shortDesc,
        whatIsTreatment: svc.whatIsTreatment,
        treatmentDuration: svc.duration,
        image: svc.image,
        icon: svc.icon,
        categoryId: categoryIds[svc.categorySlug],
        benefits: svc.benefits,
        treatmentSteps: svc.steps,
        faqs: svc.faqs,
        featured: svc.featured ?? false,
        sortOrder: i,
        enabled: true,
      },
      create: {
        name: svc.name,
        slug: svc.slug,
        description: svc.description,
        shortDesc: svc.shortDesc,
        whatIsTreatment: svc.whatIsTreatment,
        treatmentDuration: svc.duration,
        image: svc.image,
        icon: svc.icon,
        price: svc.price ? new Prisma.Decimal(svc.price) : null,
        categoryId: categoryIds[svc.categorySlug],
        benefits: svc.benefits,
        treatmentSteps: svc.steps,
        faqs: svc.faqs,
        featured: svc.featured ?? false,
        sortOrder: i,
        enabled: true,
      },
    });
  }

  const doctorCount = await prisma.doctor.count();
  if (doctorCount === 0) {
    await prisma.doctor.create({
      data: {
        name: "Dr. Rishikesh Prasad",
        slug: "dr-rishikesh-prasad",
        qualification: "B.D.S. (Hons), M.Sc (Microbiology), MIDA, C.C.C.M.",
        specialization: "Oral & Dental Surgeon",
        experienceYears: 10,
        summary:
          "Registered oral and dental surgeon offering comprehensive mouth and dental surgical care at Shiv Dental Clinic.",
        registrationNumber: "XX84/A/2017",
        phone: "9973479904",
        bio: "Dr. Rishikesh Prasad (डॉ. ऋषिकेश प्रसाद) is an Oral & Dental Surgeon at Shiv Dental Clinic with qualifications including B.D.S. (Honours), M.Sc in Microbiology, MIDA, and C.C.C.M. Patients receive careful diagnosis, clear guidance, and comfortable treatment in a professional setting.",
        image: "/images/shiv-dental-branding.jpg",
        areasOfExpertise: [
          "Dental Implants",
          "Root Canal Treatment",
          "Cosmetic Dentistry",
          "Oral Surgery",
        ],
        languagesSpoken: "Hindi, English",
        weeklySchedule: {
          monday: { enabled: true, start: "10:00", end: "18:00" },
          tuesday: { enabled: true, start: "10:00", end: "18:00" },
          wednesday: { enabled: true, start: "10:00", end: "18:00" },
          thursday: { enabled: true, start: "10:00", end: "18:00" },
          friday: { enabled: true, start: "10:00", end: "18:00" },
          saturday: { enabled: true, start: "10:00", end: "14:00" },
          sunday: { enabled: false, start: "10:00", end: "14:00" },
        },
        consultationHours: "Mon – Sat: 10:00 AM – 6:00 PM (Sat until 2:00 PM)",
        featured: true,
        enabled: true,
        sortOrder: 0,
      },
    });
  }

  const allDoctors = await prisma.doctor.findMany({ select: { id: true } });
  const allServices = await prisma.service.findMany({
    where: { enabled: true },
    select: { id: true },
  });
  const branchSlug = "shiv-dental-sg-r-annexe";
  await prisma.branch.upsert({
    where: { slug: branchSlug },
    update: {
      doctorIds: allDoctors.map((d) => d.id),
      serviceIds: allServices.map((s) => s.id),
      published: true,
      featured: true,
    },
    create: {
      name: "Shiv Dental Clinic — SG R Annexe",
      slug: branchSlug,
      address: "SG R Annexe, Shiv Dental Clinic",
      city: "Mumbai",
      state: "Maharashtra",
      location: "SG R Annexe, Shiv Dental Clinic",
      phone: "9973479904",
      whatsapp: "9973479904",
      openTime: "10:00 AM",
      closeTime: "7:00 PM",
      offDays: "Sunday",
      weeklySchedule: {
        monday: { enabled: true, start: "10:00", end: "19:00" },
        tuesday: { enabled: true, start: "10:00", end: "19:00" },
        wednesday: { enabled: true, start: "10:00", end: "19:00" },
        thursday: { enabled: true, start: "10:00", end: "19:00" },
        friday: { enabled: true, start: "10:00", end: "19:00" },
        saturday: { enabled: true, start: "10:00", end: "19:00" },
        sunday: { enabled: false, start: "10:00", end: "14:00" },
      },
      doctorIds: allDoctors.map((d) => d.id),
      serviceIds: allServices.map((s) => s.id),
      featured: true,
      published: true,
      status: "ACTIVE",
      sortOrder: 0,
    },
  });

  const templateSlugs = [
    {
      slug: "appointment-confirmation",
      name: "Appointment Confirmation",
      subject: "Your appointment request — Shiv Dental Clinic",
      body: "Thank you for contacting Shiv Dental Clinic. Your appointment request has been received. Our team will call you shortly to confirm your date and time. If you need urgent help, please call the clinic directly.",
    },
    {
      slug: "appointment-reminder",
      name: "Appointment Reminder",
      subject: "Reminder — upcoming visit at Shiv Dental Clinic",
      body: "This is a friendly reminder from Shiv Dental Clinic about your upcoming dental appointment. Please arrive a few minutes early. Reply to this message or call us if you need to reschedule.",
    },
    {
      slug: "general-enquiry",
      name: "General Enquiry",
      subject: "Thank you for contacting Shiv Dental Clinic",
      body: "Thank you for reaching out to Shiv Dental Clinic. We have received your message and a member of our team will get back to you shortly. We appreciate your trust in our care.",
    },
  ];
  for (let i = 0; i < templateSlugs.length; i++) {
    const t = templateSlugs[i]!;
    await prisma.messageTemplate.upsert({
      where: { slug: t.slug },
      update: { name: t.name, subject: t.subject, body: t.body, sortOrder: i },
      create: { ...t, sortOrder: i },
    });
  }

  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.create({
      data: {
        patientName: "Priya Sharma",
        rating: 5,
        testimonial:
          "Very professional treatment and friendly staff. I felt completely comfortable throughout my treatment.",
        treatment: "Root Canal Treatment",
        verifiedPatient: true,
        status: "PUBLISHED",
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Seed completed");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
