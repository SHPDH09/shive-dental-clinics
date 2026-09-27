export type ServiceFaq = { question: string; answer: string };

export type PublicService = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string | null;
  whatIsTreatment: string | null;
  image: string | null;
  icon: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  treatmentDuration: string | null;
  price: string | null;
  hidePrice: boolean;
  benefits: string[];
  treatmentSteps: string[];
  faqs: ServiceFaq[];
  featured: boolean;
  enabled: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};
