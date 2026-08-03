import { Injectable, NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../../config/configuration";
import type { IRoomOwnershipVerifier } from "../domain/room-ownership-verifier.interface";

/**
 * OBSERVED CLIENT BEHAVIOR, NOT AN OFFICIALLY DOCUMENTED IMVU API.
 *
 * `https://api.imvu.com/room/room-<clientId>-<roomId>` is the resource-graph
 * endpoint IMVU's own "Next" web client (a WASM app, codename "northstar")
 * fetches to render a room page. Confirmed by hitting it directly, cold, in
 * an incognito window with zero IMVU session/cookies: it responds 200 with
 * the room's public data — including `data.description`, which is exactly
 * where the ownership-verification token gets pasted (mirroring Vusic's
 * "VALIDAR SALA" flow). Since it's undocumented, IMVU could change or lock
 * this down at any time — that risk is why it's isolated behind
 * `IRoomOwnershipVerifier` and overridable via `IMVU_ROOM_PAGE_URL_TEMPLATE`
 * rather than hardcoded elsewhere.
 */
const DEFAULT_ROOM_API_URL_TEMPLATE = "https://api.imvu.com/room/room-{roomId}";

@Injectable()
export class ImvuRoomApiVerifier implements IRoomOwnershipVerifier {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  async descriptionContainsToken(imvuRoomId: string, token: string): Promise<boolean> {
    const template = this.config.get("imvu.roomPageUrlTemplate", { infer: true }) || DEFAULT_ROOM_API_URL_TEMPLATE;
    const url = template.replace("{roomId}", encodeURIComponent(imvuRoomId));

    const response = await fetch(url);
    if (response.status === 404) {
      throw new NotFoundException("That IMVU room doesn't exist");
    }
    if (!response.ok) {
      throw new ServiceUnavailableException(`Could not reach the IMVU room API (HTTP ${response.status})`);
    }

    const body = await response.text();

    // The endpoint wraps room data in a resource graph keyed by URL — rather
    // than depend on that exact shape, checking the raw body for the token
    // is robust to it changing as long as the description text is in there
    // somewhere, and cheap since the token is a random, collision-free string.
    if (body.includes('"status":"error"') || body.includes('"status": "error"')) {
      throw new NotFoundException("That IMVU room doesn't exist");
    }

    return body.includes(token);
  }
}
