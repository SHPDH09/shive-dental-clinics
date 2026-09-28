import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { imapFromSmtp, resolveSmtpConfig } from "@/lib/mail/smtp-config";
import { upsertInboxMail } from "@/lib/mail/mail-store";

export async function syncInboxFromGmail(limit = 40): Promise<{ synced: number; error?: string }> {
  const smtp = await resolveSmtpConfig();
  if (!smtp) {
    return { synced: 0, error: "SMTP/IMAP credentials not configured" };
  }

  const imapCfg = imapFromSmtp(smtp);
  const client = new ImapFlow({
    host: imapCfg.host,
    port: imapCfg.port,
    secure: imapCfg.secure,
    auth: { user: imapCfg.user, pass: imapCfg.pass },
    logger: false,
  });

  const rows: Parameters<typeof upsertInboxMail>[0] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const total = client.mailbox && typeof client.mailbox === "object" ? client.mailbox.exists : 0;
      const start = Math.max(1, total - limit + 1);
      for await (const msg of client.fetch(`${start}:*`, { envelope: true, source: true, uid: true })) {
        const uid = msg.uid;
        if (!uid || !msg.source) continue;
        const parsed = await simpleParser(msg.source);
        const from = parsed.from?.value?.[0]?.address ?? msg.envelope?.from?.[0]?.address ?? "";
        const toParsed = parsed.to;
        let to: string[] = [];
        if (toParsed && !Array.isArray(toParsed) && "value" in toParsed && Array.isArray(toParsed.value)) {
          to = toParsed.value.map((a) => a.address).filter(Boolean) as string[];
        } else if (msg.envelope?.to) {
          to = msg.envelope.to.map((a) => a.address).filter(Boolean) as string[];
        }
        rows.push({
          id: `gmail-inbox-${uid}`,
          folder: "inbox",
          imapUid: uid,
          fromAddress: from,
          toAddresses: to as string[],
          ccAddresses: [],
          subject: parsed.subject ?? msg.envelope?.subject ?? "(No subject)",
          bodyText: parsed.text ?? null,
          bodyHtml: typeof parsed.html === "string" ? parsed.html : null,
          read: false,
          starred: false,
          sentAt: (parsed.date ?? new Date()).toISOString(),
        });
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "IMAP sync failed";
    console.error("imap sync:", msg);
    return { synced: 0, error: msg };
  }

  const synced = await upsertInboxMail(rows);
  return { synced };
}
