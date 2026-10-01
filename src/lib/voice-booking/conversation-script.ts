/** Warm, human receptionist-style lines (Hindi + light English). */

export function getTimeGreeting(date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "Hello, good morning!";
  if (h >= 12 && h < 17) return "Hello, good afternoon!";
  if (h >= 17 && h < 21) return "Hello, good evening!";
  return "Hello, good night!";
}

export function getClosingDayWish(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Have a good day!";
  if (h >= 12 && h < 17) return "Have a wonderful afternoon!";
  if (h >= 17 && h < 21) return "Have a lovely evening!";
  return "Have a good night, take care!";
}

export function welcomeConversation(): string[] {
  const hello = getTimeGreeting();
  return [
    hello,
    "Namaste! Main Shiv Dental Clinic ki Virtual Assistant hoon.",
    "Aapki appointment main yahin se book karwa dungi — step by step, bilkul aaram se.",
    "Chaliye shuru karte hain.",
  ];
}

export function successConversation(name: string, ref: string): string[] {
  const first = name.trim().split(/\s+/)[0] || name;
  return [
    `${first} ji, aapka bahut bahut dhanyavaad.`,
    "Aapki appointment book ho chuki hai.",
    ref && ref !== "OK" ? `Aapka reference number hai ${ref}.` : "",
    "Hum jald hi aapko confirm kar denge.",
    getClosingDayWish(),
  ].filter(Boolean);
}
