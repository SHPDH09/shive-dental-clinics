import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createPgPool } from "../src/lib/pg-pool";
import { slugify } from "../src/lib/utils";

const pool = createPgPool(process.env.DATABASE_URL!);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const defaultServices = [
  ["General Dentistry", "Comprehensive oral care for everyday dental health."],
  ["Teeth Cleaning", "Professional cleaning to keep your smile bright and healthy."],
  ["Dental Implants", "Permanent tooth replacement with natural-looking results."],
  ["Root Canal Treatment", "Pain-free root canal therapy to save your natural tooth."],
  ["Teeth Whitening", "Safe cosmetic whitening for a brighter, confident smile."],
  ["Dental Braces", "Orthodontic treatment for aligned teeth and improved bite."],
  ["Cosmetic Dentistry", "Smile makeovers tailored to your aesthetic goals."],
  ["Pediatric Dentistry", "Gentle dental care designed especially for children."],
  ["Tooth Extraction", "Safe and comfortable extractions when necessary."],
  ["Dental Checkup", "Routine exams to prevent problems before they start."],
];

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@shivdentalclinic.com";
  const password = process.env.ADMIN_PASSWORD ?? "Admin@123";
  const hash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: {
      name: "Clinic Admin",
      email,
      passwordHash: hash,
      role: "SUPER_ADMIN",
    },
  });

  await prisma.clinicSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      aboutIntro:
        "Shiv Dental Clinic is a modern dental care center dedicated to compassionate, high-quality treatment for patients of all ages.",
      mission: "To deliver painless, ethical, and advanced dental care with a personal touch.",
      vision: "To be the most trusted dental clinic in our community for healthy, confident smiles.",
      whyChooseUs:
        "We combine experienced specialists, modern technology, and a warm environment so every visit feels comfortable and clear.",
      openingHours: {
        weekdays: "Mon – Sat: 9:00 AM – 8:00 PM",
        sunday: "Sun: 10:00 AM – 2:00 PM (Emergency)",
      },
      socialLinks: {
        facebook: "https://facebook.com",
        instagram: "https://instagram.com",
      },
      seoTitle: "Shiv Dental Clinic | Premium Dental Care",
      seoDescription:
        "Book appointments at Shiv Dental Clinic — expert dentists, modern treatments, and compassionate care for your whole family.",
    },
  });

  const statCount = await prisma.heroStat.count();
  if (statCount === 0) {
    await prisma.heroStat.createMany({
      data: [
        { label: "Years Experience", value: "10+", sortOrder: 0 },
        { label: "Happy Patients", value: "5,000+", sortOrder: 1 },
        { label: "Dental Treatments", value: "20+", sortOrder: 2 },
        { label: "Patient Rating", value: "4.9/5", sortOrder: 3 },
      ],
    });
  }

  for (let i = 0; i < defaultServices.length; i++) {
    const [name, description] = defaultServices[i];
    const slug = slugify(name);
    await prisma.service.upsert({
      where: { slug },
      update: {},
      create: {
        name,
        slug,
        description,
        shortDesc: description,
        sortOrder: i,
        enabled: true,
      },
    });
  }

  const doctorCount = await prisma.doctor.count();
  if (doctorCount === 0) {
    await prisma.doctor.create({
      data: {
        name: "Dr. Shiv Patel",
        qualification: "BDS, MDS (Prosthodontics)",
        specialization: "Cosmetic & Restorative Dentistry",
        experienceYears: 12,
        bio: "Dr. Shiv Patel leads Shiv Dental Clinic with a patient-first approach and expertise in smile design and implants.",
        consultationHours: "Mon – Sat: 10:00 AM – 6:00 PM",
        enabled: true,
      },
    });
  }

  const testimonialCount = await prisma.testimonial.count();
  if (testimonialCount === 0) {
    await prisma.testimonial.create({
      data: {
        patientName: "Priya Sharma",
        rating: 5,
        testimonial:
          "Excellent treatment and very friendly staff. The entire experience was comfortable and professional.",
        treatment: "Dental Cleaning",
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
