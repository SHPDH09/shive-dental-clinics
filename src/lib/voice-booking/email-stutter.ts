/** Collapse consecutive repeated chunks in compact STT (raunakraunak → raunak). */
export function collapseConsecutiveRepeats(s: string): string {
  let prev = "";
  let cur = s;
  for (let round = 0; round < 12; round++) {
    prev = cur;
    for (let len = 14; len >= 2; len--) {
      cur = cur.replace(new RegExp(`(.{${len}})\\1+`, "g"), "$1");
    }
    if (cur === prev) break;
  }
  return cur;
}

export function cleanEmailLocalPart(local: string): string {
  let l = local.toLowerCase().replace(/[^a-z0-9._+-]/g, "");
  l = collapseConsecutiveRepeats(l);
  if (l.length > 64) {
    l = collapseConsecutiveRepeats(l.slice(0, 80)).slice(0, 64);
  }
  return l;
}

/** Fix stuttered compact email before regex parse. */
export function repairStutteredEmailCompact(compact: string): string {
  const t = compact.toLowerCase();
  const at = t.lastIndexOf("@");
  if (at <= 0) return collapseConsecutiveRepeats(t.replace(/[^a-z0-9@._+-]/g, ""));

  const domain = t.slice(at + 1).replace(/[^a-z0-9.-]/g, "");
  const local = cleanEmailLocalPart(t.slice(0, at));
  if (!local || !domain) return collapseConsecutiveRepeats(t);
  return `${local}@${domain}`;
}
