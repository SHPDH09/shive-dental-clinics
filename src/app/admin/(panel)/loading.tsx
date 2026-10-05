import { SdcLogoLoader } from "@/components/branding/sdc-logo-loader";

export default function AdminPanelLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <SdcLogoLoader size="lg" label="Loading…" />
    </div>
  );
}
