import { SdcLogoLoader, type SdcLogoLoaderSize } from "@/components/branding/sdc-logo-loader";
import { cn } from "@/lib/utils";

type Props = {
  loading: boolean;
  label?: string;
  children: React.ReactNode;
  className?: string;
  minHeight?: string;
  size?: SdcLogoLoaderSize;
  /** Dim content under the loader (default true). */
  dimContent?: boolean;
  theme?: "light" | "dark";
};

/** Section-level loader — use whenever a page block is fetching data (including refetch). */
export function DataLoadingSection({
  loading,
  label = "Loading…",
  children,
  className,
  minHeight = "min-h-[200px]",
  size = "md",
  dimContent = true,
  theme = "light",
}: Props) {
  return (
    <div className={cn("relative", minHeight, className)}>
      {loading ? (
        <div
          className={cn(
            "absolute inset-0 z-20 flex items-center justify-center rounded-2xl backdrop-blur-[3px]",
            theme === "dark" ? "bg-[#0f1d3d]/88" : "bg-white/92",
          )}
          aria-busy="true"
        >
          <SdcLogoLoader size={size} label={label} theme={theme} />
        </div>
      ) : null}
      <div className={cn(loading && dimContent && "pointer-events-none select-none opacity-45")}>{children}</div>
    </div>
  );
}
