import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AppConfig } from "../../../config/configuration";
import type { IRoomOwnershipVerifier } from "../domain/room-ownership-verifier.interface";

/**
 * REVERSE-ENGINEERED / OBSERVED, NOT OFFICIALLY DOCUMENTED.
 *
 * IMVU does not publish an API for reading a room's public description over
 * plain HTTP. Vusic's "VALIDAR SALA" button clearly does this somehow, but we
 * don't yet have the exact request it makes. Rather than fabricate a URL, this
 * adapter stays unconfigured (and fails loudly, not silently) until
 * `IMVU_ROOM_PAGE_URL_TEMPLATE` is set to a confirmed real endpoint — capture
 * it from your browser's Network tab while triggering room validation on a
 * known-working client, and set it here (`{roomId}` is substituted with the
 * `<clientId>-<roomId>` slug parsed from the room URL).
 */
@Injectable()
export class ImvuRoomPageVerifier implements IRoomOwnershipVerifier {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  async descriptionContainsToken(imvuRoomId: string, token: string): Promise<boolean> {
    const template = this.config.get("imvu.roomPageUrlTemplate", { infer: true });
    if (!template) {
      throw new ServiceUnavailableException(
        "Room verification is not configured yet: IMVU_ROOM_PAGE_URL_TEMPLATE is unset. " +
          "IMVU has no documented endpoint for reading a room's description over HTTP — " +
          "we need the actual request behind Vusic's room validation (e.g. captured from " +
          "a browser Network tab) before this check can run for real.",
      );
    }

    const url = template.replace("{roomId}", encodeURIComponent(imvuRoomId));
    const response = await fetch(url);
    if (!response.ok) {
      throw new ServiceUnavailableException(`Could not reach the IMVU room page (HTTP ${response.status})`);
    }

    const html = await response.text();
    return html.includes(token);
  }
}
