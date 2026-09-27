const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export function isLocked(lockedUntil: Date | null | undefined): boolean {
  if (!lockedUntil) return false;
  return lockedUntil.getTime() > Date.now();
}

export function nextLockState(
  attempts: number,
  lockedUntil: Date | null,
): { loginAttempts: number; lockedUntil: Date | null } {
  const nextAttempts = attempts + 1;
  if (nextAttempts >= MAX_ATTEMPTS) {
    return {
      loginAttempts: 0,
      lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000),
    };
  }
  return { loginAttempts: nextAttempts, lockedUntil };
}

export function clearLockState(): { loginAttempts: number; lockedUntil: null } {
  return { loginAttempts: 0, lockedUntil: null };
}

export { MAX_ATTEMPTS, LOCK_MINUTES };
