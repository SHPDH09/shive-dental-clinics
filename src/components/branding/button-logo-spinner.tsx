import { SdcLogoLoader } from "@/components/branding/sdc-logo-loader";
import { cn } from "@/lib/utils";

/** Mini logo loader for buttons and icon slots. */
export function ButtonLogoSpinner({ className, label = "Loading…" }: { className?: string; label?: string }) {
  return (
    <SdcLogoLoader
      size="xs"
      label={label}
      hideLabel
      inline
      className={cn("py-0 [&_.sdc-logo-loader__visual]:scale-90", className)}
    />
  );
}
