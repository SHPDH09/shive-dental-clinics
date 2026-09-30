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
    "Main Shiv Dental Clinic ki virtual reception hoon — aap se baat karke khushi ho rahi hai.",
    "Shiv Dental Clinic mein aapka dil se swagat hai.",
    "Aaj main aapki madad se appointment book karungi — step by step, bilkul clinic jaisa.",
    "Pehle batayein — kya aap dental appointment book karna chahte hain? Haan ya nahi, jo aapko comfortable ho.",
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
