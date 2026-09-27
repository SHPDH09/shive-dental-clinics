import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { createPgPool } from "../src/lib/pg-pool";
import { slugify } from "../src/lib/utils";
import { DEFAULT_SERVICE_CATEGORIES } from "../src/lib/service-categories";

const pool = createPgPool(process.env.DATABASE_URL!);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1606811841689-23dfebdce3e7?w=800&q=80";

type SeedService = {
  name: string;
  icon: string;
  categorySlug: string;
  shortDesc: string;
  description: string;
  whatIsTreatment: string;
  duration: string;
  price?: string;
  featured?: boolean;
  benefits: string[];
  steps: string[];
};

const defaultServices: SeedService[] = [
  {
    name: "Dental Checkup",
    icon: "🦷",
    categorySlug: "preventive-dentistry",
    shortDesc: "A gentle full-mouth check to catch problems early and keep your smile healthy.",
    description:
      "Regular dental checkups help you stay ahead of cavities, gum issues, and tooth pain before they become bigger problems.",
    whatIsTreatment:
      "Your dentist examines your teeth, gums, and mouth, and may take X-rays if needed. It is a comfortable visit focused on prevention.",
    duration: "20–30 minutes",
    price: "500",
    featured: true,
    benefits: ["Early detection of cavities", "Personalized oral care tips", "Peace of mind for your family"],
    steps: ["Warm welcome & history", "Oral examination", "Advice & next steps", "Schedule follow-up if needed"],
  },
  {
    name: "Teeth Cleaning & Scaling",
    icon: "🪥",
    categorySlug: "preventive-dentistry",
    shortDesc: "Professional cleaning removes plaque and tartar for fresher breath and healthier gums.",
    description:
      "Even with daily brushing, hardened deposits can build up. Scaling and polishing leave your teeth feeling smooth and clean.",
    whatIsTreatment:
      "We gently remove plaque and tartar above and below the gum line, then polish your teeth to reduce future buildup.",
    duration: "30–45 minutes",
    price: "800",
    benefits: ["Healthier gums", "Brighter-looking teeth", "Reduced bad breath"],
    steps: ["Assessment", "Scaling", "Polishing", "Home-care guidance"],
  },
  {
    name: "Teeth Whitening",
    icon: "✨",
    categorySlug: "cosmetic-dentistry",
    shortDesc: "Safe whitening options to brighten stained or dull teeth.",
    description: "Professional whitening is planned around your sensitivity and smile goals for a natural-looking result.",
    whatIsTreatment:
      "We use clinic-grade whitening to lighten tooth shade safely, with protection for your gums and enamel.",
    duration: "45–60 minutes",
    price: "6000",
    featured: true,
    benefits: ["Noticeably brighter smile", "Supervised by your dentist", "Boost in confidence"],
    steps: ["Shade assessment", "Gum protection", "Whitening session", "After-care tips"],
  },
  {
    name: "Root Canal Treatment",
    icon: "🩺",
    categorySlug: "general-dentistry",
    shortDesc: "Comfortable treatment to save a damaged tooth and stop deep tooth pain.",
    description:
      "When infection reaches the nerve, a root canal removes the source of pain and helps you keep your natural tooth.",
    whatIsTreatment:
      "We clean the infected area inside the tooth, seal it, and usually place a crown later for strength.",
    duration: "60–90 minutes (may need 2 visits)",
    price: "4500",
    featured: true,
    benefits: ["Relief from toothache", "Save your natural tooth", "Restore comfortable chewing"],
    steps: ["Consultation & X-ray", "Painless anesthesia", "Cleaning & sealing", "Crown if advised"],
  },
  {
    name: "Dental Braces & Orthodontics",
    icon: "😁",
    categorySlug: "orthodontics",
    shortDesc: "Straighten crowded or misaligned teeth for a balanced bite and confident smile.",
    description: "Orthodontic care gradually moves teeth into better alignment using braces or aligners tailored to you.",
    whatIsTreatment:
      "Braces or aligners apply gentle pressure over time. We monitor progress with regular adjustment visits.",
    duration: "12–24 months (varies)",
    benefits: ["Straighter teeth", "Easier cleaning", "Improved bite comfort"],
    steps: ["Orthodontic assessment", "Treatment plan", "Fitting braces/aligners", "Regular reviews"],
  },
  {
    name: "Dental Implants",
    icon: "🦷",
    categorySlug: "implant-dentistry",
    shortDesc: "A long-lasting option to replace missing teeth that looks and feels natural.",
    description: "Implants anchor a crown to the jawbone, helping restore chewing and smile appearance.",
    whatIsTreatment:
      "A small titanium post is placed in the bone; after healing, a custom crown is attached on top.",
    duration: "Multiple visits over 3–6 months",
    price: "25000",
    benefits: ["Stable tooth replacement", "Natural appearance", "Protects neighboring teeth"],
    steps: ["3D planning", "Implant placement", "Healing phase", "Final crown"],
  },
  {
    name: "Cosmetic Dentistry",
    icon: "💎",
    categorySlug: "cosmetic-dentistry",
    shortDesc: "Smile enhancements including veneers, shaping, and aesthetic bonding.",
    description: "Cosmetic treatments focus on the look of your smile while keeping oral health in mind.",
    whatIsTreatment: "We discuss your smile goals and recommend veneers, bonding, or other aesthetic options.",
    duration: "Varies by treatment",
    benefits: ["Customized smile design", "Natural-looking results", "Improved self-confidence"],
    steps: ["Smile consultation", "Digital planning", "Treatment", "Final polish"],
  },
  {
    name: "Pediatric Dentistry",
    icon: "👶",
    categorySlug: "pediatric-dentistry",
    shortDesc: "Friendly dental care for children in a calm, reassuring environment.",
    description: "We help kids build positive dental habits with gentle exams and preventive care.",
    whatIsTreatment: "Child-focused exams, fluoride, sealants, and guidance for parents on brushing routines.",
    duration: "20–40 minutes",
    benefits: ["Reduced dental fear", "Strong baby & adult teeth", "Parent-friendly advice"],
    steps: ["Meet & greet", "Gentle exam", "Cleaning if needed", "Sticker & tips!"],
  },
  {
    name: "Tooth Extraction",
    icon: "🦷",
    categorySlug: "general-dentistry",
    shortDesc: "Safe removal of a painful or severely damaged tooth when it cannot be saved.",
    description: "When a tooth must come out, we prioritize comfort and clear after-care instructions.",
    whatIsTreatment: "The area is numbed, the tooth is removed carefully, and you receive healing guidance.",
    duration: "20–40 minutes",
    benefits: ["Stops spreading infection", "Relieves pain", "Prepares for replacement options"],
    steps: ["Assessment & X-ray", "Anesthesia", "Extraction", "After-care kit & advice"],
  },
  {
    name: "Smile Makeover",
    icon: "✨",
    categorySlug: "cosmetic-dentistry",
    shortDesc: "A combined plan of treatments to refresh your entire smile.",
    description: "Smile makeovers blend whitening, alignment, and restorations for a harmonious result.",
    whatIsTreatment: "We create a step-by-step plan that may include whitening, veneers, or gum contouring.",
    duration: "Varies (often several visits)",
    featured: true,
    benefits: ["Coordinated treatment plan", "Balanced, natural smile", "One team you trust"],
    steps: ["Smile analysis", "Preview plan", "Staged treatments", "Final review"],
  },
  {
    name: "Dental Fillings",
    icon: "🪥",
    categorySlug: "general-dentistry",
    shortDesc: "Repair small cavities and restore tooth shape with tooth-colored materials.",
    description: "Fillings stop decay from spreading and bring back comfortable chewing.",
    whatIsTreatment: "Decay is removed, the tooth is cleaned, and a filling is placed to rebuild the surface.",
    duration: "30–45 minutes",
    price: "1200",
    benefits: ["Stops cavity growth", "Tooth-colored options", "Same-day comfort"],
    steps: ["Numbing if needed", "Remove decay", "Place filling", "Bite check"],
  },
  {
    name: "Crowns & Bridges",
    icon: "🦷",
    categorySlug: "general-dentistry",
    shortDesc: "Restore broken teeth or replace gaps with strong, natural-looking crowns and bridges.",
    description: "Crowns cap weak teeth; bridges fill spaces left by missing teeth.",
    whatIsTreatment: "We prepare the tooth, take impressions, and fit a custom crown or bridge.",
    duration: "2 visits, 45–60 min each",
    price: "8000",
    benefits: ["Strong chewing surface", "Natural appearance", "Protects damaged teeth"],
    steps: ["Consultation", "Tooth preparation", "Lab fabrication", "Final fit & polish"],
  },
];

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
        { label: "Dental Treatments", value: "20+", sortOrder: 2 },
        { label: "Patient Rating", value: "4.9/5", sortOrder: 3 },
      ],
    });
  }

  const categoryIds: Record<string, string> = {};
  for (let i = 0; i < DEFAULT_SERVICE_CATEGORIES.length; i++) {
    const cat = DEFAULT_SERVICE_CATEGORIES[i];
    const row = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, sortOrder: i },
      create: { name: cat.name, slug: cat.slug, sortOrder: i },
    });
    categoryIds[cat.slug] = row.id;
  }

  for (let i = 0; i < defaultServices.length; i++) {
    const svc = defaultServices[i];
    const slug = slugify(svc.name);
    await prisma.service.upsert({
      where: { slug },
      update: {
        shortDesc: svc.shortDesc,
        whatIsTreatment: svc.whatIsTreatment,
        treatmentDuration: svc.duration,
        benefits: svc.benefits,
        treatmentSteps: svc.steps,
        featured: svc.featured ?? false,
        icon: svc.icon,
        image: PLACEHOLDER_IMAGE,
        categoryId: categoryIds[svc.categorySlug],
      },
      create: {
        name: svc.name,
        slug,
        description: svc.description,
        shortDesc: svc.shortDesc,
        whatIsTreatment: svc.whatIsTreatment,
        treatmentDuration: svc.duration,
        image: PLACEHOLDER_IMAGE,
        icon: svc.icon,
        price: svc.price ? new Prisma.Decimal(svc.price) : null,
        categoryId: categoryIds[svc.categorySlug],
        benefits: svc.benefits,
        treatmentSteps: svc.steps,
        faqs: [],
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

  const branchCount = await prisma.branch.count();
  if (branchCount === 0) {
    await prisma.branch.create({
      data: {
        name: "Shiv Dental Clinic — SG R Annexe",
        location: "SG R Annexe, Shiv Dental Clinic",
        phone: "9973479904",
        openTime: "9:00 AM",
        closeTime: "8:00 PM",
        offDays: "Sunday",
        status: "ACTIVE",
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
