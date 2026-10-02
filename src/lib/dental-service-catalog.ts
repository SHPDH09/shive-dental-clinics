/**
 * Full Shiv Dental Clinic service catalog — categories + treatments (English / Hindi).
 * Used by seed and scripts/apply-dental-service-catalog.ts
 */

export type DentalCatalogCategory = {
  slug: string;
  name: string;
  icon: string;
  image: string;
};

export type DentalCatalogService = {
  slug: string;
  name: string;
  categorySlug: string;
  icon: string;
  image: string;
  shortDesc: string;
  description: string;
  whatIsTreatment: string;
  duration: string;
  price?: string;
  featured?: boolean;
  benefits: string[];
  steps: string[];
  faqs: { question: string; answer: string }[];
};

const IMG = {
  general:
    "https://images.unsplash.com/photo-1606811841689-23dfebdce3e7?w=900&auto=format&fit=crop&q=80",
  preventive:
    "https://images.unsplash.com/photo-1629909613654-1000c2a4a3c8?w=900&auto=format&fit=crop&q=80",
  restorative:
    "https://images.unsplash.com/photo-1598256989837-4fe674ae7e44?w=900&auto=format&fit=crop&q=80",
  rct: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&auto=format&fit=crop&q=80",
  prosthodontics:
    "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=900&auto=format&fit=crop&q=80",
  cosmetic:
    "https://images.unsplash.com/photo-1606811971614-448e94cc3dba?w=900&auto=format&fit=crop&q=80",
  oralSurgery:
    "https://images.unsplash.com/photo-1579686527813-5b7698347d7b?w=900&auto=format&fit=crop&q=80",
  pediatric:
    "https://images.unsplash.com/photo-1631815589968-fdb031354fce?w=900&auto=format&fit=crop&q=80",
  orthodontics:
    "https://images.unsplash.com/photo-1629909840597-b8fc877b8b28?w=900&auto=format&fit=crop&q=80",
  gum: "https://images.unsplash.com/photo-1606260807119-4cb21a608902?w=900&auto=format&fit=crop&q=80",
  emergency:
    "https://images.unsplash.com/photo-1581594690022-9f697c3600c2?w=900&auto=format&fit=crop&q=80",
  implant:
    "https://images.unsplash.com/photo-1559757143-0bf3c63a8c0f?w=900&auto=format&fit=crop&q=80",
} as const;

export const DENTAL_CATALOG_CATEGORIES: DentalCatalogCategory[] = [
  {
    slug: "general-dentistry",
    name: "General Dentistry / सामान्य दंत चिकित्सा",
    icon: "🦷",
    image: IMG.general,
  },
  {
    slug: "preventive-dentistry",
    name: "Preventive Dentistry / निवारक दंत चिकित्सा",
    icon: "🪥",
    image: IMG.preventive,
  },
  {
    slug: "restorative-dentistry",
    name: "Restorative Dentistry / दांतों की मरम्मत",
    icon: "🦷",
    image: IMG.restorative,
  },
  {
    slug: "root-canal-treatment",
    name: "Root Canal Treatment / रूट कैनाल उपचार",
    icon: "🦷",
    image: IMG.rct,
  },
  {
    slug: "prosthodontics",
    name: "Prosthodontics / कृत्रिम दंत चिकित्सा",
    icon: "👑",
    image: IMG.prosthodontics,
  },
  {
    slug: "cosmetic-dentistry",
    name: "Cosmetic Dentistry / कॉस्मेटिक दंत चिकित्सा",
    icon: "😁",
    image: IMG.cosmetic,
  },
  {
    slug: "oral-surgery",
    name: "Oral Surgery / मौखिक शल्य चिकित्सा",
    icon: "🦷",
    image: IMG.oralSurgery,
  },
  {
    slug: "pediatric-dentistry",
    name: "Pediatric Dentistry / बच्चों की दंत चिकित्सा",
    icon: "🦷",
    image: IMG.pediatric,
  },
  {
    slug: "orthodontics",
    name: "Orthodontics / ऑर्थोडॉन्टिक्स",
    icon: "😬",
    image: IMG.orthodontics,
  },
  {
    slug: "gum-treatment",
    name: "Gum Treatment / मसूड़ों का उपचार",
    icon: "🦷",
    image: IMG.gum,
  },
  {
    slug: "dental-emergency",
    name: "Dental Emergency / आपातकालीन दंत चिकित्सा",
    icon: "🦷",
    image: IMG.emergency,
  },
  {
    slug: "dental-implant",
    name: "Dental Implant / डेंटल इम्प्लांट",
    icon: "🦷",
    image: IMG.implant,
  },
];

type RawService = {
  en: string;
  hi: string;
  slug: string;
  featured?: boolean;
  duration?: string;
};

function bilingual(en: string, hi: string) {
  return `${en} / ${hi}`;
}

function buildService(
  raw: RawService,
  categorySlug: string,
  categoryIcon: string,
  categoryImage: string,
): DentalCatalogService {
  const name = bilingual(raw.en, raw.hi);
  const duration = raw.duration ?? "30–45 minutes";
  return {
    slug: raw.slug,
    name,
    categorySlug,
    icon: categoryIcon,
    image: categoryImage,
    shortDesc: `Professional ${raw.en.toLowerCase()} at Shiv Dental Clinic with clear guidance in Hindi and English.`,
    description: `${name} — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.`,
    whatIsTreatment: `During your visit for ${raw.en}, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.`,
    duration,
    featured: raw.featured,
    benefits: [
      "Experienced oral & dental surgeon",
      "Hygienic, patient-first care",
      "Clear cost and visit guidance",
      "Hindi & English communication",
    ],
    steps: [
      "Consultation & examination",
      "Digital records / X-ray if needed",
      "Treatment as planned",
      "After-care & follow-up advice",
    ],
    faqs: [
      {
        question: `Is ${raw.en} painful?`,
        answer:
          "We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain.",
      },
      {
        question: "How do I book?",
        answer: "Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time.",
      },
    ],
  };
}

function servicesForCategory(
  categorySlug: keyof typeof CATEGORY_SERVICES,
): DentalCatalogService[] {
  const cat = DENTAL_CATALOG_CATEGORIES.find((c) => c.slug === categorySlug)!;
  return CATEGORY_SERVICES[categorySlug].map((raw) =>
    buildService(raw, cat.slug, cat.icon, cat.image),
  );
}

const CATEGORY_SERVICES = {
  "general-dentistry": [
    { en: "Dental Consultation", hi: "दंत परामर्श", slug: "dental-consultation", featured: true },
    { en: "Dental Check-up", hi: "दांतों की जांच", slug: "dental-check-up", featured: true },
    { en: "Oral Examination", hi: "मुंह एवं दांतों की जांच", slug: "oral-examination" },
    { en: "Digital Dental X-Ray", hi: "डिजिटल दंत एक्स-रे", slug: "digital-dental-x-ray" },
    { en: "Tooth Pain Treatment", hi: "दांत दर्द का उपचार", slug: "tooth-pain-treatment", featured: true },
    { en: "Tooth Sensitivity Treatment", hi: "दांतों की संवेदनशीलता का उपचार", slug: "tooth-sensitivity-treatment" },
    { en: "Gum Disease Treatment", hi: "मसूड़ों की बीमारी का उपचार", slug: "gum-disease-treatment-general" },
    { en: "Oral Hygiene Counseling", hi: "मौखिक स्वच्छता परामर्श", slug: "oral-hygiene-counseling" },
  ],
  "preventive-dentistry": [
    { en: "Teeth Cleaning", hi: "दांतों की सफाई", slug: "teeth-cleaning", featured: true },
    { en: "Dental Scaling", hi: "डेंटल स्केलिंग", slug: "dental-scaling", featured: true },
    { en: "Polishing", hi: "दांतों की पॉलिशिंग", slug: "dental-polishing" },
    { en: "Fluoride Treatment", hi: "फ्लोराइड उपचार", slug: "fluoride-treatment" },
    { en: "Pit & Fissure Sealants", hi: "पिट एवं फिशर सीलेंट", slug: "pit-fissure-sealants" },
    { en: "Preventive Dental Care", hi: "निवारक दंत देखभाल", slug: "preventive-dental-care" },
  ],
  "restorative-dentistry": [
    { en: "Dental Filling", hi: "दांतों की फिलिंग", slug: "dental-filling", featured: true },
    { en: "Tooth Restoration", hi: "दांतों की पुनर्स्थापना", slug: "tooth-restoration" },
    { en: "Composite Filling", hi: "कंपोजिट फिलिंग", slug: "composite-filling" },
    { en: "GIC Filling", hi: "GIC फिलिंग", slug: "gic-filling" },
    { en: "Broken Tooth Repair", hi: "टूटे दांत की मरम्मत", slug: "broken-tooth-repair" },
  ],
  "root-canal-treatment": [
    { en: "Root Canal Treatment (RCT)", hi: "रूट कैनाल उपचार", slug: "root-canal-treatment-rct", featured: true, duration: "60–90 minutes" },
    { en: "Single Sitting RCT", hi: "सिंगल सिटिंग RCT", slug: "single-sitting-rct", duration: "90–120 minutes" },
    { en: "Re-RCT", hi: "दोबारा रूट कैनाल उपचार", slug: "re-rct", duration: "60–90 minutes" },
    { en: "Post & Core Treatment", hi: "पोस्ट एवं कोर उपचार", slug: "post-core-treatment", duration: "45–60 minutes" },
  ],
  prosthodontics: [
    { en: "Dental Crown", hi: "डेंटल क्राउन", slug: "dental-crown", featured: true, duration: "2 visits" },
    { en: "Dental Bridge", hi: "डेंटल ब्रिज", slug: "dental-bridge", duration: "2 visits" },
    { en: "Dentures", hi: "नकली दांत", slug: "dentures" },
    { en: "Complete Dentures", hi: "पूर्ण नकली दांत", slug: "complete-dentures" },
    { en: "Partial Dentures", hi: "आंशिक नकली दांत", slug: "partial-dentures" },
    { en: "Dental Veneers", hi: "डेंटल विनियर्स", slug: "dental-veneers-prosthodontics" },
    { en: "Dental Inlays & Onlays", hi: "डेंटल इनले एवं ऑनले", slug: "dental-inlays-onlays" },
  ],
  "cosmetic-dentistry": [
    { en: "Teeth Whitening", hi: "दांतों की सफेदी", slug: "teeth-whitening", featured: true },
    { en: "Smile Designing", hi: "स्माइल डिजाइनिंग", slug: "smile-designing", featured: true },
    { en: "Dental Veneers", hi: "डेंटल विनियर्स", slug: "dental-veneers-cosmetic" },
    { en: "Tooth Bonding", hi: "टूथ बॉन्डिंग", slug: "tooth-bonding" },
    { en: "Tooth Reshaping", hi: "दांतों की शेप सुधारना", slug: "tooth-reshaping" },
  ],
  "oral-surgery": [
    { en: "Tooth Extraction", hi: "दांत निकालना", slug: "tooth-extraction", featured: true },
    { en: "Wisdom Tooth Extraction", hi: "अक्ल दाढ़ निकालना", slug: "wisdom-tooth-extraction", featured: true },
    { en: "Surgical Extraction", hi: "सर्जिकल दांत निकालना", slug: "surgical-extraction" },
    { en: "Minor Oral Surgery", hi: "छोटी मौखिक सर्जरी", slug: "minor-oral-surgery" },
    { en: "Abscess Drainage", hi: "दांत के फोड़े की सफाई", slug: "abscess-drainage" },
  ],
  "pediatric-dentistry": [
    { en: "Children Dental Check-up", hi: "बच्चों के दांतों की जांच", slug: "children-dental-check-up", featured: true },
    { en: "Milk Tooth Treatment", hi: "दूध के दांतों का उपचार", slug: "milk-tooth-treatment" },
    { en: "Fluoride Application", hi: "फ्लोराइड उपचार", slug: "pediatric-fluoride-application" },
    { en: "Pediatric Filling", hi: "बच्चों के दांतों की फिलिंग", slug: "pediatric-filling" },
    { en: "Child Oral Hygiene", hi: "बच्चों की मौखिक स्वच्छता", slug: "child-oral-hygiene" },
  ],
  orthodontics: [
    { en: "Braces Treatment", hi: "ब्रेसेज़ उपचार", slug: "braces-treatment", featured: true, duration: "12–24 months" },
    { en: "Metal Braces", hi: "मेटल ब्रेसेज़", slug: "metal-braces" },
    { en: "Ceramic Braces", hi: "सिरेमिक ब्रेसेज़", slug: "ceramic-braces" },
    { en: "Clear Aligners", hi: "क्लियर अलाइनर्स", slug: "clear-aligners", featured: true },
    { en: "Teeth Alignment", hi: "दांतों को सही स्थिति में लाना", slug: "teeth-alignment" },
    { en: "Retainers", hi: "रिटेनर उपचार", slug: "retainers" },
  ],
  "gum-treatment": [
    { en: "Gingivitis Treatment", hi: "मसूड़ों की सूजन का उपचार", slug: "gingivitis-treatment" },
    { en: "Periodontitis Treatment", hi: "पेरियोडोंटाइटिस उपचार", slug: "periodontitis-treatment" },
    { en: "Deep Cleaning", hi: "गहरी दांतों की सफाई", slug: "deep-cleaning", featured: true },
    { en: "Gum Therapy", hi: "मसूड़ों की थेरेपी", slug: "gum-therapy" },
    { en: "Gum Bleeding Treatment", hi: "मसूड़ों से खून आने का उपचार", slug: "gum-bleeding-treatment" },
  ],
  "dental-emergency": [
    { en: "Emergency Dental Consultation", hi: "आपातकालीन दंत परामर्श", slug: "emergency-dental-consultation", featured: true },
    { en: "Severe Toothache Treatment", hi: "तेज दांत दर्द का उपचार", slug: "severe-toothache-treatment", featured: true },
    { en: "Dental Trauma Treatment", hi: "दांतों की चोट का उपचार", slug: "dental-trauma-treatment" },
    { en: "Broken Tooth Emergency", hi: "टूटे दांत का आपातकालीन उपचार", slug: "broken-tooth-emergency" },
    { en: "Dental Abscess Treatment", hi: "दांत के फोड़े का उपचार", slug: "dental-abscess-treatment" },
  ],
  "dental-implant": [
    { en: "Dental Implant Consultation", hi: "डेंटल इम्प्लांट परामर्श", slug: "dental-implant-consultation", featured: true },
    { en: "Dental Implant Placement", hi: "डेंटल इम्प्लांट लगाना", slug: "dental-implant-placement", featured: true, duration: "3–6 months (staged)" },
    { en: "Implant Crown", hi: "इम्प्लांट क्राउन", slug: "implant-crown" },
    { en: "Implant-Supported Denture", hi: "इम्प्लांट सपोर्टेड डेंचर", slug: "implant-supported-denture" },
  ],
} satisfies Record<string, RawService[]>;

export const DENTAL_CATALOG_SERVICES: DentalCatalogService[] = (
  Object.keys(CATEGORY_SERVICES) as (keyof typeof CATEGORY_SERVICES)[]
).flatMap((key) => servicesForCategory(key));
