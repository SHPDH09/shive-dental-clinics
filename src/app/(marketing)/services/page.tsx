import type { Metadata } from "next";
import { getPublicServices } from "@/lib/public-data";
import { ServiceCard } from "@/components/public/service-card";
import { DENTAL_CATALOG_CATEGORIES } from "@/lib/dental-service-catalog";

export const metadata: Metadata = {
  title: "Dental Services",
  description:
    "From routine checkups to advanced dental treatments, Shiv Dental Clinic provides comfortable and personalized care for every smile.",
};

export default async function ServicesPage() {
  const services = await getPublicServices();

  const categoryOrder = DENTAL_CATALOG_CATEGORIES.map((c) => c.slug);
  const grouped = new Map<string, typeof services>();
  for (const svc of services) {
    const key = svc.categorySlug ?? "other";
    const list = grouped.get(key) ?? [];
    list.push(svc);
    grouped.set(key, list);
  }

  const sections = [
    ...categoryOrder
      .filter((slug) => grouped.has(slug))
      .map((slug) => ({
        slug,
        title:
          DENTAL_CATALOG_CATEGORIES.find((c) => c.slug === slug)?.name ??
          grouped.get(slug)![0]?.categoryName ??
          slug,
        items: grouped.get(slug)!,
      })),
    ...(grouped.has("other")
      ? [{ slug: "other", title: "Other services", items: grouped.get("other")! }]
      : []),
  ];

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white pb-20 pt-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Complete Dental Care Under One Roof
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            From routine checkups to advanced dental treatments, Shiv Dental Clinic provides comfortable and
            personalized care for every smile — organized by specialty in English and Hindi.
          </p>
        </div>

        {sections.length === 0 ? (
          <p className="mt-12 text-center text-slate-500">
            Our service list is being updated. Please call the clinic to book.
          </p>
        ) : (
          <div className="mt-14 space-y-16">
            {sections.map((section) => (
              <section key={section.slug} id={section.slug}>
                <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{section.title}</h2>
                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
