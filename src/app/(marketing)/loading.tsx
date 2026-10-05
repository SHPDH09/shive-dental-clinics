import { SdcLogoLoader } from "@/components/branding/sdc-logo-loader";

export default function MarketingLoading() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4">
      <SdcLogoLoader size="xl" label="Loading page…" />
    </div>
  );
}
