-- Shiv Dental Clinic — full service catalog (generated)
-- Supabase → SQL Editor → paste & Run (backup first)
-- Regenerate: npx tsx scripts/generate-dental-catalog-sql.ts

BEGIN;

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_general_dentistry', 'General Dentistry / सामान्य दंत चिकित्सा', 'general-dentistry', 0, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_preventive_dentistry', 'Preventive Dentistry / निवारक दंत चिकित्सा', 'preventive-dentistry', 1, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_restorative_dentistry', 'Restorative Dentistry / दांतों की मरम्मत', 'restorative-dentistry', 2, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_root_canal_treatment', 'Root Canal Treatment / रूट कैनाल उपचार', 'root-canal-treatment', 3, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_prosthodontics', 'Prosthodontics / कृत्रिम दंत चिकित्सा', 'prosthodontics', 4, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_cosmetic_dentistry', 'Cosmetic Dentistry / कॉस्मेटिक दंत चिकित्सा', 'cosmetic-dentistry', 5, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_oral_surgery', 'Oral Surgery / मौखिक शल्य चिकित्सा', 'oral-surgery', 6, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_pediatric_dentistry', 'Pediatric Dentistry / बच्चों की दंत चिकित्सा', 'pediatric-dentistry', 7, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_orthodontics', 'Orthodontics / ऑर्थोडॉन्टिक्स', 'orthodontics', 8, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_gum_treatment', 'Gum Treatment / मसूड़ों का उपचार', 'gum-treatment', 9, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_dental_emergency', 'Dental Emergency / आपातकालीन दंत चिकित्सा', 'dental-emergency', 10, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "ServiceCategory" ("id", "name", "slug", "sortOrder", "createdAt", "updatedAt")
VALUES ('scat_dental_implant', 'Dental Implant / डेंटल इम्प्लांट', 'dental-implant', 11, NOW(), NOW())
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_consultation',
  'Dental Consultation / दंत परामर्श',
  'dental-consultation',
  'Dental Consultation / दंत परामर्श — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental consultation at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Consultation, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811841689-23dfebdce3e7?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'general-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Consultation painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  0,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_check_up',
  'Dental Check-up / दांतों की जांच',
  'dental-check-up',
  'Dental Check-up / दांतों की जांच — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental check-up at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Check-up, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811841689-23dfebdce3e7?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'general-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Check-up painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  1,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_oral_examination',
  'Oral Examination / मुंह एवं दांतों की जांच',
  'oral-examination',
  'Oral Examination / मुंह एवं दांतों की जांच — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional oral examination at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Oral Examination, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811841689-23dfebdce3e7?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'general-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Oral Examination painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  2,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_digital_dental_x_ray',
  'Digital Dental X-Ray / डिजिटल दंत एक्स-रे',
  'digital-dental-x-ray',
  'Digital Dental X-Ray / डिजिटल दंत एक्स-रे — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional digital dental x-ray at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Digital Dental X-Ray, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811841689-23dfebdce3e7?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'general-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Digital Dental X-Ray painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  3,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_tooth_pain_treatment',
  'Tooth Pain Treatment / दांत दर्द का उपचार',
  'tooth-pain-treatment',
  'Tooth Pain Treatment / दांत दर्द का उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional tooth pain treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Tooth Pain Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811841689-23dfebdce3e7?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'general-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Tooth Pain Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  4,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_tooth_sensitivity_treatment',
  'Tooth Sensitivity Treatment / दांतों की संवेदनशीलता का उपचार',
  'tooth-sensitivity-treatment',
  'Tooth Sensitivity Treatment / दांतों की संवेदनशीलता का उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional tooth sensitivity treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Tooth Sensitivity Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811841689-23dfebdce3e7?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'general-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Tooth Sensitivity Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  5,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_gum_disease_treatment_general',
  'Gum Disease Treatment / मसूड़ों की बीमारी का उपचार',
  'gum-disease-treatment-general',
  'Gum Disease Treatment / मसूड़ों की बीमारी का उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional gum disease treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Gum Disease Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811841689-23dfebdce3e7?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'general-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Gum Disease Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  6,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_oral_hygiene_counseling',
  'Oral Hygiene Counseling / मौखिक स्वच्छता परामर्श',
  'oral-hygiene-counseling',
  'Oral Hygiene Counseling / मौखिक स्वच्छता परामर्श — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional oral hygiene counseling at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Oral Hygiene Counseling, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811841689-23dfebdce3e7?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'general-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Oral Hygiene Counseling painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  7,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_teeth_cleaning',
  'Teeth Cleaning / दांतों की सफाई',
  'teeth-cleaning',
  'Teeth Cleaning / दांतों की सफाई — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional teeth cleaning at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Teeth Cleaning, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909613654-1000c2a4a3c8?w=900&auto=format&fit=crop&q=80',
  '🪥',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'preventive-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Teeth Cleaning painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  8,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_scaling',
  'Dental Scaling / डेंटल स्केलिंग',
  'dental-scaling',
  'Dental Scaling / डेंटल स्केलिंग — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental scaling at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Scaling, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909613654-1000c2a4a3c8?w=900&auto=format&fit=crop&q=80',
  '🪥',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'preventive-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Scaling painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  9,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_polishing',
  'Polishing / दांतों की पॉलिशिंग',
  'dental-polishing',
  'Polishing / दांतों की पॉलिशिंग — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional polishing at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Polishing, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909613654-1000c2a4a3c8?w=900&auto=format&fit=crop&q=80',
  '🪥',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'preventive-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Polishing painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  10,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_fluoride_treatment',
  'Fluoride Treatment / फ्लोराइड उपचार',
  'fluoride-treatment',
  'Fluoride Treatment / फ्लोराइड उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional fluoride treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Fluoride Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909613654-1000c2a4a3c8?w=900&auto=format&fit=crop&q=80',
  '🪥',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'preventive-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Fluoride Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  11,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_pit_fissure_sealants',
  'Pit & Fissure Sealants / पिट एवं फिशर सीलेंट',
  'pit-fissure-sealants',
  'Pit & Fissure Sealants / पिट एवं फिशर सीलेंट — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional pit & fissure sealants at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Pit & Fissure Sealants, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909613654-1000c2a4a3c8?w=900&auto=format&fit=crop&q=80',
  '🪥',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'preventive-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Pit & Fissure Sealants painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  12,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_preventive_dental_care',
  'Preventive Dental Care / निवारक दंत देखभाल',
  'preventive-dental-care',
  'Preventive Dental Care / निवारक दंत देखभाल — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional preventive dental care at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Preventive Dental Care, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909613654-1000c2a4a3c8?w=900&auto=format&fit=crop&q=80',
  '🪥',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'preventive-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Preventive Dental Care painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  13,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_filling',
  'Dental Filling / दांतों की फिलिंग',
  'dental-filling',
  'Dental Filling / दांतों की फिलिंग — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental filling at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Filling, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1598256989837-4fe674ae7e44?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'restorative-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Filling painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  14,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_tooth_restoration',
  'Tooth Restoration / दांतों की पुनर्स्थापना',
  'tooth-restoration',
  'Tooth Restoration / दांतों की पुनर्स्थापना — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional tooth restoration at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Tooth Restoration, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1598256989837-4fe674ae7e44?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'restorative-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Tooth Restoration painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  15,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_composite_filling',
  'Composite Filling / कंपोजिट फिलिंग',
  'composite-filling',
  'Composite Filling / कंपोजिट फिलिंग — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional composite filling at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Composite Filling, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1598256989837-4fe674ae7e44?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'restorative-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Composite Filling painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  16,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_gic_filling',
  'GIC Filling / GIC फिलिंग',
  'gic-filling',
  'GIC Filling / GIC फिलिंग — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional gic filling at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for GIC Filling, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1598256989837-4fe674ae7e44?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'restorative-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is GIC Filling painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  17,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_broken_tooth_repair',
  'Broken Tooth Repair / टूटे दांत की मरम्मत',
  'broken-tooth-repair',
  'Broken Tooth Repair / टूटे दांत की मरम्मत — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional broken tooth repair at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Broken Tooth Repair, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1598256989837-4fe674ae7e44?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'restorative-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Broken Tooth Repair painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  18,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_root_canal_treatment_rct',
  'Root Canal Treatment (RCT) / रूट कैनाल उपचार',
  'root-canal-treatment-rct',
  'Root Canal Treatment (RCT) / रूट कैनाल उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional root canal treatment (rct) at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Root Canal Treatment (RCT), our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'root-canal-treatment' LIMIT 1),
  '60–90 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Root Canal Treatment (RCT) painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  19,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_single_sitting_rct',
  'Single Sitting RCT / सिंगल सिटिंग RCT',
  'single-sitting-rct',
  'Single Sitting RCT / सिंगल सिटिंग RCT — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional single sitting rct at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Single Sitting RCT, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'root-canal-treatment' LIMIT 1),
  '90–120 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Single Sitting RCT painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  20,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_re_rct',
  'Re-RCT / दोबारा रूट कैनाल उपचार',
  're-rct',
  'Re-RCT / दोबारा रूट कैनाल उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional re-rct at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Re-RCT, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'root-canal-treatment' LIMIT 1),
  '60–90 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Re-RCT painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  21,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_post_core_treatment',
  'Post & Core Treatment / पोस्ट एवं कोर उपचार',
  'post-core-treatment',
  'Post & Core Treatment / पोस्ट एवं कोर उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional post & core treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Post & Core Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'root-canal-treatment' LIMIT 1),
  '45–60 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Post & Core Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  22,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_crown',
  'Dental Crown / डेंटल क्राउन',
  'dental-crown',
  'Dental Crown / डेंटल क्राउन — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental crown at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Crown, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=900&auto=format&fit=crop&q=80',
  '👑',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'prosthodontics' LIMIT 1),
  '2 visits',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Crown painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  23,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_bridge',
  'Dental Bridge / डेंटल ब्रिज',
  'dental-bridge',
  'Dental Bridge / डेंटल ब्रिज — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental bridge at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Bridge, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=900&auto=format&fit=crop&q=80',
  '👑',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'prosthodontics' LIMIT 1),
  '2 visits',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Bridge painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  24,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dentures',
  'Dentures / नकली दांत',
  'dentures',
  'Dentures / नकली दांत — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dentures at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dentures, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=900&auto=format&fit=crop&q=80',
  '👑',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'prosthodontics' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dentures painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  25,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_complete_dentures',
  'Complete Dentures / पूर्ण नकली दांत',
  'complete-dentures',
  'Complete Dentures / पूर्ण नकली दांत — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional complete dentures at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Complete Dentures, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=900&auto=format&fit=crop&q=80',
  '👑',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'prosthodontics' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Complete Dentures painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  26,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_partial_dentures',
  'Partial Dentures / आंशिक नकली दांत',
  'partial-dentures',
  'Partial Dentures / आंशिक नकली दांत — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional partial dentures at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Partial Dentures, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=900&auto=format&fit=crop&q=80',
  '👑',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'prosthodontics' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Partial Dentures painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  27,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_veneers_prosthodontics',
  'Dental Veneers / डेंटल विनियर्स',
  'dental-veneers-prosthodontics',
  'Dental Veneers / डेंटल विनियर्स — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental veneers at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Veneers, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=900&auto=format&fit=crop&q=80',
  '👑',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'prosthodontics' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Veneers painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  28,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_inlays_onlays',
  'Dental Inlays & Onlays / डेंटल इनले एवं ऑनले',
  'dental-inlays-onlays',
  'Dental Inlays & Onlays / डेंटल इनले एवं ऑनले — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental inlays & onlays at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Inlays & Onlays, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=900&auto=format&fit=crop&q=80',
  '👑',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'prosthodontics' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Inlays & Onlays painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  29,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_teeth_whitening',
  'Teeth Whitening / दांतों की सफेदी',
  'teeth-whitening',
  'Teeth Whitening / दांतों की सफेदी — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional teeth whitening at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Teeth Whitening, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811971614-448e94cc3dba?w=900&auto=format&fit=crop&q=80',
  '😁',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'cosmetic-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Teeth Whitening painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  30,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_smile_designing',
  'Smile Designing / स्माइल डिजाइनिंग',
  'smile-designing',
  'Smile Designing / स्माइल डिजाइनिंग — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional smile designing at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Smile Designing, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811971614-448e94cc3dba?w=900&auto=format&fit=crop&q=80',
  '😁',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'cosmetic-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Smile Designing painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  31,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_veneers_cosmetic',
  'Dental Veneers / डेंटल विनियर्स',
  'dental-veneers-cosmetic',
  'Dental Veneers / डेंटल विनियर्स — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental veneers at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Veneers, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811971614-448e94cc3dba?w=900&auto=format&fit=crop&q=80',
  '😁',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'cosmetic-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Veneers painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  32,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_tooth_bonding',
  'Tooth Bonding / टूथ बॉन्डिंग',
  'tooth-bonding',
  'Tooth Bonding / टूथ बॉन्डिंग — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional tooth bonding at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Tooth Bonding, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811971614-448e94cc3dba?w=900&auto=format&fit=crop&q=80',
  '😁',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'cosmetic-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Tooth Bonding painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  33,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_tooth_reshaping',
  'Tooth Reshaping / दांतों की शेप सुधारना',
  'tooth-reshaping',
  'Tooth Reshaping / दांतों की शेप सुधारना — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional tooth reshaping at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Tooth Reshaping, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606811971614-448e94cc3dba?w=900&auto=format&fit=crop&q=80',
  '😁',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'cosmetic-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Tooth Reshaping painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  34,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_tooth_extraction',
  'Tooth Extraction / दांत निकालना',
  'tooth-extraction',
  'Tooth Extraction / दांत निकालना — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional tooth extraction at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Tooth Extraction, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1579686527813-5b7698347d7b?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'oral-surgery' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Tooth Extraction painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  35,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_wisdom_tooth_extraction',
  'Wisdom Tooth Extraction / अक्ल दाढ़ निकालना',
  'wisdom-tooth-extraction',
  'Wisdom Tooth Extraction / अक्ल दाढ़ निकालना — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional wisdom tooth extraction at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Wisdom Tooth Extraction, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1579686527813-5b7698347d7b?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'oral-surgery' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Wisdom Tooth Extraction painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  36,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_surgical_extraction',
  'Surgical Extraction / सर्जिकल दांत निकालना',
  'surgical-extraction',
  'Surgical Extraction / सर्जिकल दांत निकालना — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional surgical extraction at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Surgical Extraction, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1579686527813-5b7698347d7b?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'oral-surgery' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Surgical Extraction painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  37,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_minor_oral_surgery',
  'Minor Oral Surgery / छोटी मौखिक सर्जरी',
  'minor-oral-surgery',
  'Minor Oral Surgery / छोटी मौखिक सर्जरी — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional minor oral surgery at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Minor Oral Surgery, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1579686527813-5b7698347d7b?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'oral-surgery' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Minor Oral Surgery painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  38,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_abscess_drainage',
  'Abscess Drainage / दांत के फोड़े की सफाई',
  'abscess-drainage',
  'Abscess Drainage / दांत के फोड़े की सफाई — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional abscess drainage at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Abscess Drainage, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1579686527813-5b7698347d7b?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'oral-surgery' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Abscess Drainage painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  39,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_children_dental_check_up',
  'Children Dental Check-up / बच्चों के दांतों की जांच',
  'children-dental-check-up',
  'Children Dental Check-up / बच्चों के दांतों की जांच — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional children dental check-up at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Children Dental Check-up, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1631815589968-fdb031354fce?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'pediatric-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Children Dental Check-up painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  40,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_milk_tooth_treatment',
  'Milk Tooth Treatment / दूध के दांतों का उपचार',
  'milk-tooth-treatment',
  'Milk Tooth Treatment / दूध के दांतों का उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional milk tooth treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Milk Tooth Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1631815589968-fdb031354fce?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'pediatric-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Milk Tooth Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  41,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_pediatric_fluoride_application',
  'Fluoride Application / फ्लोराइड उपचार',
  'pediatric-fluoride-application',
  'Fluoride Application / फ्लोराइड उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional fluoride application at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Fluoride Application, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1631815589968-fdb031354fce?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'pediatric-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Fluoride Application painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  42,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_pediatric_filling',
  'Pediatric Filling / बच्चों के दांतों की फिलिंग',
  'pediatric-filling',
  'Pediatric Filling / बच्चों के दांतों की फिलिंग — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional pediatric filling at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Pediatric Filling, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1631815589968-fdb031354fce?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'pediatric-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Pediatric Filling painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  43,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_child_oral_hygiene',
  'Child Oral Hygiene / बच्चों की मौखिक स्वच्छता',
  'child-oral-hygiene',
  'Child Oral Hygiene / बच्चों की मौखिक स्वच्छता — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional child oral hygiene at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Child Oral Hygiene, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1631815589968-fdb031354fce?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'pediatric-dentistry' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Child Oral Hygiene painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  44,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_braces_treatment',
  'Braces Treatment / ब्रेसेज़ उपचार',
  'braces-treatment',
  'Braces Treatment / ब्रेसेज़ उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional braces treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Braces Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909840597-b8fc877b8b28?w=900&auto=format&fit=crop&q=80',
  '😬',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'orthodontics' LIMIT 1),
  '12–24 months',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Braces Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  45,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_metal_braces',
  'Metal Braces / मेटल ब्रेसेज़',
  'metal-braces',
  'Metal Braces / मेटल ब्रेसेज़ — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional metal braces at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Metal Braces, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909840597-b8fc877b8b28?w=900&auto=format&fit=crop&q=80',
  '😬',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'orthodontics' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Metal Braces painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  46,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_ceramic_braces',
  'Ceramic Braces / सिरेमिक ब्रेसेज़',
  'ceramic-braces',
  'Ceramic Braces / सिरेमिक ब्रेसेज़ — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional ceramic braces at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Ceramic Braces, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909840597-b8fc877b8b28?w=900&auto=format&fit=crop&q=80',
  '😬',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'orthodontics' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Ceramic Braces painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  47,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_clear_aligners',
  'Clear Aligners / क्लियर अलाइनर्स',
  'clear-aligners',
  'Clear Aligners / क्लियर अलाइनर्स — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional clear aligners at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Clear Aligners, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909840597-b8fc877b8b28?w=900&auto=format&fit=crop&q=80',
  '😬',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'orthodontics' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Clear Aligners painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  48,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_teeth_alignment',
  'Teeth Alignment / दांतों को सही स्थिति में लाना',
  'teeth-alignment',
  'Teeth Alignment / दांतों को सही स्थिति में लाना — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional teeth alignment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Teeth Alignment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909840597-b8fc877b8b28?w=900&auto=format&fit=crop&q=80',
  '😬',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'orthodontics' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Teeth Alignment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  49,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_retainers',
  'Retainers / रिटेनर उपचार',
  'retainers',
  'Retainers / रिटेनर उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional retainers at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Retainers, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1629909840597-b8fc877b8b28?w=900&auto=format&fit=crop&q=80',
  '😬',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'orthodontics' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Retainers painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  50,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_gingivitis_treatment',
  'Gingivitis Treatment / मसूड़ों की सूजन का उपचार',
  'gingivitis-treatment',
  'Gingivitis Treatment / मसूड़ों की सूजन का उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional gingivitis treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Gingivitis Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606260807119-4cb21a608902?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'gum-treatment' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Gingivitis Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  51,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_periodontitis_treatment',
  'Periodontitis Treatment / पेरियोडोंटाइटिस उपचार',
  'periodontitis-treatment',
  'Periodontitis Treatment / पेरियोडोंटाइटिस उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional periodontitis treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Periodontitis Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606260807119-4cb21a608902?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'gum-treatment' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Periodontitis Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  52,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_deep_cleaning',
  'Deep Cleaning / गहरी दांतों की सफाई',
  'deep-cleaning',
  'Deep Cleaning / गहरी दांतों की सफाई — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional deep cleaning at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Deep Cleaning, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606260807119-4cb21a608902?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'gum-treatment' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Deep Cleaning painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  53,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_gum_therapy',
  'Gum Therapy / मसूड़ों की थेरेपी',
  'gum-therapy',
  'Gum Therapy / मसूड़ों की थेरेपी — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional gum therapy at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Gum Therapy, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606260807119-4cb21a608902?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'gum-treatment' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Gum Therapy painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  54,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_gum_bleeding_treatment',
  'Gum Bleeding Treatment / मसूड़ों से खून आने का उपचार',
  'gum-bleeding-treatment',
  'Gum Bleeding Treatment / मसूड़ों से खून आने का उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional gum bleeding treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Gum Bleeding Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1606260807119-4cb21a608902?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'gum-treatment' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Gum Bleeding Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  55,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_emergency_dental_consultation',
  'Emergency Dental Consultation / आपातकालीन दंत परामर्श',
  'emergency-dental-consultation',
  'Emergency Dental Consultation / आपातकालीन दंत परामर्श — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional emergency dental consultation at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Emergency Dental Consultation, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1581594690022-9f697c3600c2?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'dental-emergency' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Emergency Dental Consultation painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  56,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_severe_toothache_treatment',
  'Severe Toothache Treatment / तेज दांत दर्द का उपचार',
  'severe-toothache-treatment',
  'Severe Toothache Treatment / तेज दांत दर्द का उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional severe toothache treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Severe Toothache Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1581594690022-9f697c3600c2?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'dental-emergency' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Severe Toothache Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  57,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_trauma_treatment',
  'Dental Trauma Treatment / दांतों की चोट का उपचार',
  'dental-trauma-treatment',
  'Dental Trauma Treatment / दांतों की चोट का उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental trauma treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Trauma Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1581594690022-9f697c3600c2?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'dental-emergency' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Trauma Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  58,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_broken_tooth_emergency',
  'Broken Tooth Emergency / टूटे दांत का आपातकालीन उपचार',
  'broken-tooth-emergency',
  'Broken Tooth Emergency / टूटे दांत का आपातकालीन उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional broken tooth emergency at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Broken Tooth Emergency, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1581594690022-9f697c3600c2?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'dental-emergency' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Broken Tooth Emergency painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  59,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_abscess_treatment',
  'Dental Abscess Treatment / दांत के फोड़े का उपचार',
  'dental-abscess-treatment',
  'Dental Abscess Treatment / दांत के फोड़े का उपचार — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental abscess treatment at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Abscess Treatment, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1581594690022-9f697c3600c2?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'dental-emergency' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Abscess Treatment painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  60,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_implant_consultation',
  'Dental Implant Consultation / डेंटल इम्प्लांट परामर्श',
  'dental-implant-consultation',
  'Dental Implant Consultation / डेंटल इम्प्लांट परामर्श — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental implant consultation at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Implant Consultation, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1559757143-0bf3c63a8c0f?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'dental-implant' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Implant Consultation painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  61,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_dental_implant_placement',
  'Dental Implant Placement / डेंटल इम्प्लांट लगाना',
  'dental-implant-placement',
  'Dental Implant Placement / डेंटल इम्प्लांट लगाना — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional dental implant placement at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Dental Implant Placement, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1559757143-0bf3c63a8c0f?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'dental-implant' LIMIT 1),
  '3–6 months (staged)',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Dental Implant Placement painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  true,
  true,
  62,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_implant_crown',
  'Implant Crown / इम्प्लांट क्राउन',
  'implant-crown',
  'Implant Crown / इम्प्लांट क्राउन — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional implant crown at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Implant Crown, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1559757143-0bf3c63a8c0f?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'dental-implant' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Implant Crown painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  63,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

INSERT INTO "Service" (
  "id", "name", "slug", "description", "shortDesc", "whatIsTreatment", "image", "icon",
  "categoryId", "treatmentDuration", "benefits", "treatmentSteps", "faqs",
  "featured", "enabled", "sortOrder", "hidePrice", "createdAt", "updatedAt"
) VALUES (
  'svc_implant_supported_denture',
  'Implant-Supported Denture / इम्प्लांट सपोर्टेड डेंचर',
  'implant-supported-denture',
  'Implant-Supported Denture / इम्प्लांट सपोर्टेड डेंचर — Shiv Dental Clinic (शिव डेंटल क्लिनिक) offers careful diagnosis, modern equipment, and comfortable care tailored to your needs.',
  'Professional implant-supported denture at Shiv Dental Clinic with clear guidance in Hindi and English.',
  'During your visit for Implant-Supported Denture, our dentist examines your mouth, explains the plan in simple language, and performs treatment with attention to comfort and hygiene.',
  'https://images.unsplash.com/photo-1559757143-0bf3c63a8c0f?w=900&auto=format&fit=crop&q=80',
  '🦷',
  (SELECT "id" FROM "ServiceCategory" WHERE "slug" = 'dental-implant' LIMIT 1),
  '30–45 minutes',
  '["Experienced oral & dental surgeon","Hygienic, patient-first care","Clear cost and visit guidance","Hindi & English communication"]'::jsonb,
  '["Consultation & examination","Digital records / X-ray if needed","Treatment as planned","After-care & follow-up advice"]'::jsonb,
  '[{"question":"Is Implant-Supported Denture painful?","answer":"We use effective local anesthesia when needed and work gently. Most patients feel only mild pressure, not sharp pain."},{"question":"How do I book?","answer":"Use the website appointment form, call 9973479904, or WhatsApp the clinic to choose a convenient time."}]'::jsonb,
  false,
  true,
  64,
  false,
  NOW(), NOW()
)
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "shortDesc" = EXCLUDED."shortDesc",
  "whatIsTreatment" = EXCLUDED."whatIsTreatment",
  "image" = EXCLUDED."image",
  "icon" = EXCLUDED."icon",
  "categoryId" = EXCLUDED."categoryId",
  "treatmentDuration" = EXCLUDED."treatmentDuration",
  "benefits" = EXCLUDED."benefits",
  "treatmentSteps" = EXCLUDED."treatmentSteps",
  "faqs" = EXCLUDED."faqs",
  "featured" = EXCLUDED."featured",
  "enabled" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = NOW();

-- Link all catalog services to every branch (booking dropdown)
UPDATE "Branch"
SET "serviceIds" = (
  SELECT COALESCE(jsonb_agg("id" ORDER BY "sortOrder"), '[]'::jsonb)
  FROM "Service"
  WHERE "enabled" = true AND "slug" IN (
    'dental-consultation', 'dental-check-up', 'oral-examination', 'digital-dental-x-ray', 'tooth-pain-treatment', 'tooth-sensitivity-treatment', 'gum-disease-treatment-general', 'oral-hygiene-counseling', 'teeth-cleaning', 'dental-scaling', 'dental-polishing', 'fluoride-treatment', 'pit-fissure-sealants', 'preventive-dental-care', 'dental-filling', 'tooth-restoration', 'composite-filling', 'gic-filling', 'broken-tooth-repair', 'root-canal-treatment-rct', 'single-sitting-rct', 're-rct', 'post-core-treatment', 'dental-crown', 'dental-bridge', 'dentures', 'complete-dentures', 'partial-dentures', 'dental-veneers-prosthodontics', 'dental-inlays-onlays', 'teeth-whitening', 'smile-designing', 'dental-veneers-cosmetic', 'tooth-bonding', 'tooth-reshaping', 'tooth-extraction', 'wisdom-tooth-extraction', 'surgical-extraction', 'minor-oral-surgery', 'abscess-drainage', 'children-dental-check-up', 'milk-tooth-treatment', 'pediatric-fluoride-application', 'pediatric-filling', 'child-oral-hygiene', 'braces-treatment', 'metal-braces', 'ceramic-braces', 'clear-aligners', 'teeth-alignment', 'retainers', 'gingivitis-treatment', 'periodontitis-treatment', 'deep-cleaning', 'gum-therapy', 'gum-bleeding-treatment', 'emergency-dental-consultation', 'severe-toothache-treatment', 'dental-trauma-treatment', 'broken-tooth-emergency', 'dental-abscess-treatment', 'dental-implant-consultation', 'dental-implant-placement', 'implant-crown', 'implant-supported-denture'
  )
)::json
WHERE "published" = true;

NOTIFY pgrst, 'reload schema';
COMMIT;