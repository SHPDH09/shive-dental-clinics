import { SdcLogoLoader } from "@/components/branding/sdc-logo-loader";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-4">
      <SdcLogoLoader size="xl" label="Loading…" />
    </div>
  );
}
