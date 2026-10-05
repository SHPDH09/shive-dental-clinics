import { SdcLogoLoader } from "@/components/branding/sdc-logo-loader";

export default function AdminLoading() {
  return (
    <div className="admin-canvas flex min-h-screen items-center justify-center px-4">
      <SdcLogoLoader size="xl" label="Loading admin…" />
    </div>
  );
}
