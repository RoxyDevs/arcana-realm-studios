/**
 * Extracts the stable room identifier from whatever a user pastes — the full
 * room URL (IMVU renders it as `.../room-<clientId>-<roomId>...`) or just the
 * bare `<clientId>-<roomId>` slug. This is what generalizes room binding:
 * every user runs the same parser against their own room's URL, nothing is
 * tied to one specific room.
 */
const ROOM_SLUG_IN_URL = /room-(\d+-\d+)/i;
const BARE_ROOM_SLUG = /^(\d+-\d+)$/;

export function parseImvuRoomIdentifier(input: string): string | null {
  const trimmed = input.trim();

  const fromUrl = trimmed.match(ROOM_SLUG_IN_URL);
  if (fromUrl) return fromUrl[1];

  const bare = trimmed.match(BARE_ROOM_SLUG);
  if (bare) return bare[1];

  return null;
}
