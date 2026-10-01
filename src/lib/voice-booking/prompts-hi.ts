/** Natural voice prompts — clinic reception tone, not robotic. */

export const HI = {
  askIntentRetry:
    "Samajh nahi aaya ji. Dental appointment book karni hai? Please haan ya nahi boliye.",
  askName: "Sabse pehle apna pura naam boliye ji — Hindi ya English, jo aapko easy ho.",
  retryName: "Naam thoda clear nahi aaya. Ek baar phir apna pura naam boliye ji.",
  askPhone: (firstName?: string) =>
    firstName
      ? `${firstName} ji, mobile number boliye — fast ya ruk ruk kar, screen par digit dikhengi. Das digit poora hone do.`
      : "Ji, mobile number boliye — speed se ya pause ke saath. Screen par digits dikhti rahengi.",
  confirmPhone: () =>
    "Ji, number screen par aa gaya hai. Sahi hai to haan boliye, galat ho to nahi — phir dubara number bol dena.",
  retryPhone: "Number poora clear nahi aaya. Phir se araam se das digit mobile boliye ji.",
  retryPhoneListen: "Sun nahi payi number. Ek baar phir mobile number boliye.",
  phoneNeedMore: "Thik hai, ab baaki digit boliye — number complete karna hai.",
  phoneGotPartial: (digitsSoFar: string) =>
    `Ji, ab tak ${digitsSoFar} sun liya. Baaki digit boliye ya poora number ek saath repeat kar dijiye.`,
  askEmail: (firstName?: string) =>
    firstName
      ? `${firstName} ji, email boliye — ruk ruk kar ya ek saath, screen par likhti jaaungi. Jaise naam at gmail dot com.`
      : "Email boliye — screen par dikhegi. Naam at gmail dot com, araam se ya fast.",
  confirmEmail: () =>
    "Email screen par likhi hai. Sahi hai to haan, warna nahi bol kar dubara poora email boliye.",
  retryEmail: "Email clear nahi hui. Jaise rahul at gmail dot com — aise phir se boliye.",
  retryEmailListen: "Email sun nahi payi. Dubara boliye — naam at gmail dot com.",
  emailNeedMore: "Theek hai, ab email ka baaki hissa boliye — at aur dot com tak.",
  askService: (options: string) =>
    `Kaun si treatment chahiye aapko? Naam bol sakte hain ya number. Options hain: ${options}`,
  retryService: "Treatment clear nahi hui. Dubara boliye ji.",
  askDate:
    "Appointment date boliye — aaj, kal, 5 October, ya 05/10/2025. Hindi English dono chalega.",
  retryDate: "Date samajh nahi aayi. Aaj ke baad ki date boliye — jaise kal ya 5 October.",
  askTime: "Time boliye — clear AM ya PM ke saath, jaise 10 AM, 3 PM, ya shaam 5 baje.",
  retryTime: "Time clear nahi hua. 10 AM ya 3 PM aise boliye — AM ya PM zaroor boliye.",
  confirm: (summary: string) =>
    `Bas ek baar confirm. ${summary} Neeche details dekhein — Confirm dabayein ya haan boliye.`,
  verifyIntro:
    "Saari details screen par hain. Sab sahi ho to Confirm & Book dabayein, ya haan boliye. Galat ho to nahi boliye.",
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
  intro: "Virtual Assistant",
  name: "Naam",
  phone: "Mobile",
  email: "Email",
  service: "Treatment",
  date: "Date",
  time: "Time",
  confirm: "Confirm",
  verify: "Verify details",
  submitting: "Book ho rahi hai…",
  done: "Ho gaya",
} as const;
