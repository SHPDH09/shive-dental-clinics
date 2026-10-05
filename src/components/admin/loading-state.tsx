import { SdcLogoLoader, type SdcLogoLoaderSize } from "@/components/branding/sdc-logo-loader";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  size?: SdcLogoLoaderSize;
  /** Shorter block for nested panels (mail thread, modals). */
  compact?: boolean;
  className?: string;
};

export function LoadingState({
  label = "Loading…",
  size = "lg",
  compact = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center",
        compact ? "py-10" : "min-h-[min(42vh,420px)] py-16",
        className,
      )}
    >
      <SdcLogoLoader size={size} label={label} />
    </div>
  );
}
