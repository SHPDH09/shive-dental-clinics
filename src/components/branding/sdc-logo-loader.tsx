import Image from "next/image";
import { CLINIC_LOGO_URL } from "@/lib/branding";
import { cn } from "@/lib/utils";

export type SdcLogoLoaderSize = "xs" | "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<SdcLogoLoaderSize, number> = {
  xs: 24,
  sm: 40,
  md: 64,
  lg: 88,
  xl: 112,
};

type Props = {
  size?: SdcLogoLoaderSize;
  label?: string;
  /** Horizontal row layout for tight spaces (tables, forms). */
  inline?: boolean;
  className?: string;
  /** Hide caption under the logo (accessibility still uses aria-label). */
  hideLabel?: boolean;
  theme?: "light" | "dark";
};

export function SdcLogoLoader({
  size = "md",
  label = "Loading…",
  inline = false,
  className,
  hideLabel = false,
  theme = "light",
}: Props) {
  const px = SIZE_PX[size];
  const showLabel = !hideLabel && Boolean(label?.trim());

  return (
    <div
      className={cn(
        "sdc-logo-loader",
        inline && "sdc-logo-loader--inline",
        theme === "dark" && "sdc-logo-loader--dark",
        `sdc-logo-loader--${size}`,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="sdc-logo-loader__visual" style={{ width: px, height: px }}>
        <div className="sdc-logo-loader__halo" aria-hidden />
        <div className="sdc-logo-loader__orbit" aria-hidden />
        <div className="sdc-logo-loader__stage">
          <div className="sdc-logo-loader__flip">
            <div className="sdc-logo-loader__face">
              <Image
                src={CLINIC_LOGO_URL}
                alt=""
                width={px}
                height={px}
                className="sdc-logo-loader__img"
                priority={size === "lg" || size === "xl"}
              />
            </div>
          </div>
          <div className="sdc-logo-loader__shine" aria-hidden />
        </div>
        <div className="sdc-logo-loader__shadow" aria-hidden />
      </div>
      {showLabel ? <p className="sdc-logo-loader__label">{label}</p> : null}
    </div>
  );
}

/** Compact loader for inline data fetches (slots, search, etc.). */
export function InlineLogoLoader({
  label = "Loading…",
  size = "sm",
  className,
}: {
  label?: string;
  size?: "xs" | "sm";
  className?: string;
}) {
  return (
    <SdcLogoLoader
      size={size}
      label={label}
      inline
      hideLabel={size === "xs"}
      className={cn("py-2", className)}
    />
  );
}
