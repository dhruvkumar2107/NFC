// The one public link for a card. The NFC chip is programmed with
// /card/<nfcCardNumber>, so every screen, QR code and SMS uses that link;
// /p/<cardId> only remains for cards without an NFC number and for old links,
// which redirect to the NFC link.
export function cardProfilePath(card?: { cardId?: string | null; nfcCardNumber?: string | null } | null): string {
  if (!card) return ''
  if (card.nfcCardNumber) return `/card/${encodeURIComponent(card.nfcCardNumber)}`
  if (card.cardId) return `/p/${encodeURIComponent(card.cardId)}`
  return ''
}
