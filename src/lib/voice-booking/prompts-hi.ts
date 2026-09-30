/** Natural voice prompts — clinic reception tone, not robotic. */

export const HI = {
  askIntentRetry:
    "Samajh nahi aaya ji. Dental appointment book karni hai? Please haan ya nahi boliye.",
  askName: "Bahut badhiya. Apna pura naam Hindi ya English mein boliye.",
  retryName: "Naam thoda clear nahi aaya. Ek baar phir apna pura naam boliye ji.",
  askPhone: (firstName?: string) =>
    firstName
      ? `${firstName} ji, bahut achha. Ab aapka das digit mobile number suniye — ek ek digit ya seedha poora number bol sakte hain.`
      : "Dhanyavaad ji. Pura das digit mobile number boliye — ek ek karke ya seedha, poora number sunna zaroori hai.",
  confirmPhone: (readback: string) =>
    `Main repeat karti hoon — aapka mobile number hai: ${readback}. Kya yeh bilkul sahi hai? Haan boliye agar theek hai, warna nahi bol kar dubara batayein.`,
  retryPhone: "Valid Indian mobile nahi mila — 10 digit, 6 se 9 se shuru. Phir se poora number boliye ji.",
  phoneNeedMore: "Thode aur digit boliye, das number complete karein.",
  askEmail: (firstName?: string) =>
    firstName
      ? `${firstName} ji, ab appointment confirmation ke liye poora email boliye — jaise naam at gmail dot com.`
      : "Poora email boliye — jaise rahul at gmail dot com, poora sunna hai.",
  confirmEmail: (readback: string) =>
    `Email main yeh sun rahi hoon: ${readback}. Kya yeh sahi hai? Haan ya nahi boliye ji.`,
  retryEmail: "Email sahi format mein nahi aaya. Dubara poora email boliye — at aur dot com clear boliye.",
  emailNeedMore: "Email ka baaki hissa boliye, at aur dot com tak poora.",
  useSavedPhone: (readback: string) =>
    `Pehle se saved number mila: ${readback}. Kya isi number par call chahiye? Haan boliye use karne ke liye.`,
  useSavedEmail: (readback: string) =>
    `Saved email hai: ${readback}. Kya isi par confirmation bhejein? Haan ya nahi.`,
  askService: (options: string) =>
    `Kaun si treatment chahiye aapko? Naam bol sakte hain ya number. Options hain: ${options}`,
  retryService: "Treatment clear nahi hui. Dubara boliye ji.",
  askDate: "Date boliye — today, tomorrow, aaj, kal, ya koi date. Hindi English dono.",
  retryDate: "Date clear nahi hui. Aaj ke baad ki koi date boliye.",
  askTime: "Time boliye — 10 AM, subah das baje, ya 3 PM. Hindi English dono.",
  retryTime: "Time samajh nahi aaya. Phir se time boliye.",
  confirm: (summary: string) =>
    `Theek hai ji, main poori booking ek baar sunati hoon. ${summary}. Sab sahi hai to haan boliye, kuch badalna ho to nahi boliye.`,
  declinedBooking:
    "Koi baat nahi ji. Jab chahe dubara call kar sakte hain. Shiv Dental Clinic aapka intezar karega.",
  cancelled: "Theek hai ji, booking cancel kar di. Kabhi bhi dubara try kar sakte hain.",
  failed: "Maaf kijiye, abhi voice se booking complete nahi ho payi. Neeche form se book kar lijiye.",
  listening: "Main sun rahi hoon… ab boliye ji.",
  gotIt: "Ji, samajh gayi. Ek second.",
  retryListen: "Kuch clear nahi aaya. Phir se boliye ji.",
  retryListenShort: "Sirf haan ya nahi boliye.",
  hearing: (t: string) => `Sun rahi hoon: ${t}`,
  youSaid: (t: string) => `Ji, aapne kaha: ${t}`,
  tapToSpeak: "Mic dabakar boliye",
  tapToSpeakAgain: "Phir se mic dabakar boliye",
  browserUnsupported:
    "Is browser mein voice input limited hai. Chrome ya Edge use karein, ya form bharein.",
  micDenied:
    "Mic ki permission nahi mili. Browser mein Allow karein aur dubara Shuru karein.",
} as const;

export const STEP_LABELS_HI = {
  intro: "Namaste…",
  intent: "Appointment?",
  name: "Naam",
  phone: "Mobile",
  email: "Email",
  service: "Treatment",
  date: "Date",
  time: "Time",
  confirm: "Confirm",
  submitting: "Book ho rahi hai…",
  done: "Ho gaya",
} as const;
