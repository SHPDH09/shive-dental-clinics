"use client";

type Props = {
  active: boolean;
  listening: boolean;
  className?: string;
};

/** Gemini-inspired animated orb (CSS-only, no WebGL). */
export function VoiceAssistantOrb({ active, listening, className = "" }: Props) {
  const pulse = listening || active;
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      aria-hidden
    >
      <div
        className={`absolute h-[min(72vw,280px)] w-[min(72vw,280px)] rounded-full blur-3xl transition-opacity duration-700 ${
          pulse ? "opacity-70" : "opacity-35"
        }`}
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(167,139,250,0.9), rgba(56,189,248,0.5) 45%, rgba(15,23,42,0) 70%)",
          animation: pulse ? "voice-orb-glow 4s ease-in-out infinite" : undefined,
        }}
      />
      <div
        className="relative h-[min(52vw,200px)] w-[min(52vw,200px)] rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 28%, #f0abfc 0%, #a78bfa 22%, #6366f1 48%, #0ea5e9 72%, #1e1b4b 100%)",
          boxShadow: listening
            ? "0 0 60px rgba(244,114,182,0.55), 0 0 120px rgba(99,102,241,0.35), inset 0 -20px 40px rgba(0,0,0,0.25)"
            : "0 0 40px rgba(99,102,241,0.35), inset 0 -16px 32px rgba(0,0,0,0.2)",
          transform: "perspective(600px) rotateX(8deg)",
          animation: listening
            ? "voice-orb-listen 1.2s ease-in-out infinite"
            : active
              ? "voice-orb-idle 5s ease-in-out infinite"
              : undefined,
        }}
      >
        <div
          className="absolute inset-[18%] rounded-full opacity-80"
          style={{
            background:
              "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.15) 35%, transparent 65%)",
            animation: "voice-orb-shimmer 3.5s linear infinite",
          }}
        />
        <div
          className="absolute inset-0 rounded-full opacity-40 mix-blend-overlay"
          style={{
            background:
              "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.5), transparent, rgba(56,189,248,0.4), transparent)",
            animation: "voice-orb-spin 8s linear infinite",
          }}
        />
      </div>
      <style jsx>{`
        @keyframes voice-orb-glow {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.65;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.85;
          }
        }
        @keyframes voice-orb-idle {
          0%,
          100% {
            transform: perspective(600px) rotateX(8deg) scale(1);
          }
          50% {
            transform: perspective(600px) rotateX(12deg) scale(1.03);
          }
        }
        @keyframes voice-orb-listen {
          0%,
          100% {
            transform: perspective(600px) rotateX(8deg) scale(1);
          }
          50% {
            transform: perspective(600px) rotateX(14deg) scale(1.06);
          }
        }
        @keyframes voice-orb-shimmer {
          0% {
            transform: translate(-8%, -6%) scale(1);
          }
          50% {
            transform: translate(6%, 4%) scale(1.05);
          }
          100% {
            transform: translate(-8%, -6%) scale(1);
          }
        }
        @keyframes voice-orb-spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
