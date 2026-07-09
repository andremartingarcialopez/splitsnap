const STORAGE_PREFIX = 'splitsnap_tp_';

export function saveParticipantSession(shareCode: string, ticketParticipantId: string) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${shareCode.toUpperCase()}`, ticketParticipantId);
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadParticipantSession(shareCode: string): string | null {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${shareCode.toUpperCase()}`);
  } catch {
    return null;
  }
}

export function clearParticipantSession(shareCode: string) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${shareCode.toUpperCase()}`);
  } catch {
    /* ignore */
  }
}
