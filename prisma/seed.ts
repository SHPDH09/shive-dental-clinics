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
        name: "Dr. Rishikesh Prasad",
        qualification: "B.D.S. (Hons), M.Sc (Microbiology), MIDA, C.C.C.M.",
        specialization: "Oral & Dental Surgeon",
        experienceYears: 10,
        summary:
          "Registered oral and dental surgeon offering comprehensive mouth and dental surgical care at Shiv Dental Clinic.",
        registrationNumber: "XX84/A/2017",
        phone: "9973479904",
        bio: "Dr. Rishikesh Prasad (डॉ. ऋषिकेश प्रसाद) is an Oral & Dental Surgeon at Shiv Dental Clinic with qualifications including B.D.S. (Honours), M.Sc in Microbiology, MIDA, and C.C.C.M. Patients receive careful diagnosis, clear guidance, and comfortable treatment in a professional setting.",
        image: "/images/shiv-dental-branding.jpg",
        consultationHours: "Mon – Sat: By appointment",
        featured: true,
        enabled: true,
        sortOrder: 0,
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
