"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const HINDI_NAME = "शिव डेंटल क्लिनिक";

type ClinicNameAlternateProps = {
  englishName: string;
  className?: string;
};

export function ClinicNameAlternate({ englishName, className }: ClinicNameAlternateProps) {
  const [showHindi, setShowHindi] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setShowHindi((v) => !v), 3500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className={cn("relative inline-block min-w-[10ch] text-lg tracking-tight md:min-w-[12ch]", className)}>
      <span
        className={cn(
          "block transition-all duration-500 ease-in-out",
          showHindi ? "translate-y-0 opacity-100" : "pointer-events-none absolute inset-0 -translate-y-1 opacity-0",
        )}
        aria-hidden={!showHindi}
      >
        {HINDI_NAME}
      </span>
      <span
        className={cn(
          "block transition-all duration-500 ease-in-out",
          showHindi ? "pointer-events-none absolute inset-0 translate-y-1 opacity-0" : "translate-y-0 opacity-100",
        )}
        aria-hidden={showHindi}
      >
        {englishName}
      </span>
      <span className="sr-only">
        {englishName} / {HINDI_NAME}
      </span>
    </span>
  );
}
