import { Inject, Injectable, Logger } from "@nestjs/common";
import { MusicService } from "../../music/application/music.service";
import { IMVU_ROOM_CHAT_ADAPTER, type IImvuRoomChatAdapter, type ImvuRoomChatMessage } from "../domain/imvu-room-chat-adapter.interface";
import { RoomBanService } from "./room-ban.service";

/**
 * Deterministic command layer — per the root CLAUDE.md's AI Philosophy
 * ("prefer deterministic systems assisted by AI instead of replacing
 * business logic"), this pattern-matches known command prefixes and calls
 * Arcana Music's real queue directly. No LLM involved here; a message that
 * doesn't match any command below falls through (returns null) rather than
 * being answered — the AI response layer that will one day handle those
 * (task: "Host conversacional con IA") is intentionally a separate service,
 * not folded into this one, so it can be toggled off per room independently.
 */
@Injectable()
export class ChatCommandRouter {
  private readonly logger = new Logger(ChatCommandRouter.name);

  constructor(
    private readonly music: MusicService,
    @Inject(IMVU_ROOM_CHAT_ADAPTER) private readonly adapter: IImvuRoomChatAdapter,
    private readonly roomBans: RoomBanService,
  ) {}

  /** Returns the bot's chat reply, or null if the message wasn't a recognized command. */
  async handle(roomId: string, ownerId: string, message: ImvuRoomChatMessage): Promise<string | null> {
    const trimmed = message.content.trim();
    if (!trimmed.startsWith("!")) return null;

    const [rawCommand, ...rest] = trimmed.slice(1).split(/\s+/);
    const command = rawCommand.toLowerCase();
    const argument = rest.join(" ").trim();

    try {
      switch (command) {
        case "play":
          return await this.handlePlay(roomId, ownerId, argument);
        case "skip":
          return await this.handleSkip(roomId, ownerId);
        case "queue":
        case "cola":
          return await this.handleQueue(roomId, ownerId);
        case "nowplaying":
        case "sonando":
          return await this.handleNowPlaying(roomId, ownerId);
        case "ban":
          return await this.handleBan(roomId, ownerId, message, argument);
        case "kick":
          return await this.handleKick(roomId, message, argument);
        case "unban":
          return await this.handleUnban(roomId, ownerId, message, argument);
        case "help":
        case "ayuda":
          return this.handleHelp();
        default:
          return null;
      }
    } catch (error) {
      this.logger.warn(`Command "${command}" failed for room ${roomId}: ${error instanceof Error ? error.message : error}`);
      return "⚠️ Eso no funcionó. Probá de nuevo en un momento.";
    }
  }

  /**
   * !ban/!kick/!unban only run for the room's host or an IMVU-assigned
   * moderator — senderCanModerate comes from IMVU's own live room data
   * (is_host/isMod), never from anything self-reported on Arcana's side.
   * Anyone else gets a rejection message, not silence, so it's obvious the
   * command was seen and declined rather than looking broken.
   */
  private requireModerator(message: ImvuRoomChatMessage): string | null {
    if (message.senderCanModerate) return null;
    return "🚫 Solo el dueño de la sala o un moderador puede usar ese comando.";
  }

  private async handleBan(roomId: string, ownerId: string, message: ImvuRoomChatMessage, argument: string): Promise<string> {
    const denial = this.requireModerator(message);
    if (denial) return denial;

    const [targetName, ...reasonParts] = argument.split(/\s+/).filter(Boolean);
    if (!targetName) return "Usá !ban <nombre> [motivo]";
    const reason = reasonParts.join(" ").trim() || null;

    const target = await this.adapter.findUserByDisplayName(roomId, targetName);
    if (!target) return `No encuentro a "${targetName}" en la sala ahora mismo — tiene que estar presente para banearlo por chat.`;

    await this.roomBans.ban(roomId, ownerId, target.displayName, reason);
    await this.adapter.kickUser(roomId, target.imvuId);
    return `🔨 ${target.displayName} fue baneado de esta sala${reason ? ` (${reason})` : ""} y no va a poder volver a entrar.`;
  }

  private async handleKick(roomId: string, message: ImvuRoomChatMessage, argument: string): Promise<string> {
    const denial = this.requireModerator(message);
    if (denial) return denial;

    const targetName = argument.trim();
    if (!targetName) return "Usá !kick <nombre>";

    const target = await this.adapter.findUserByDisplayName(roomId, targetName);
    if (!target) return `No encuentro a "${targetName}" en la sala ahora mismo.`;

    await this.adapter.kickUser(roomId, target.imvuId);
    return `👢 ${target.displayName} fue expulsado — puede volver a entrar (usá !ban si no querés eso).`;
  }

  private async handleUnban(roomId: string, ownerId: string, message: ImvuRoomChatMessage, argument: string): Promise<string> {
    const denial = this.requireModerator(message);
    if (denial) return denial;

    const targetName = argument.trim();
    if (!targetName) return "Usá !unban <nombre>";

    const removed = await this.roomBans.unban(roomId, ownerId, targetName);
    return removed ? `✅ ${targetName} ya no está baneado de esta sala.` : `${targetName} no estaba en la lista de baneados.`;
  }

  private async handlePlay(roomId: string, ownerId: string, query: string): Promise<string> {
    if (!query) return "Usá !play <nombre de canción o artista>";

    const results = await this.music.searchLibrary(query);
    const match = results[0];
    if (!match) return `No encontré nada para "${query}".`;

    await this.music.enqueueExisting(roomId, ownerId, match.id);
    return `🎵 Agregado a la cola: ${match.title}${match.artist ? ` — ${match.artist}` : ""}`;
  }

  private async handleSkip(roomId: string, ownerId: string): Promise<string> {
    const next = await this.music.playNext(roomId, ownerId);
    if (!next) return "La cola está vacía.";
    return `⏭️ Ahora suena: ${next.track.title}${next.track.artist ? ` — ${next.track.artist}` : ""}`;
  }

  private async handleQueue(roomId: string, ownerId: string): Promise<string> {
    const items = await this.music.getQueue(roomId, ownerId);
    if (items.length === 0) return "La cola está vacía.";
    const preview = items
      .slice(0, 5)
      .map((item, index) => `${index + 1}. ${item.track.title}${item.track.artist ? ` — ${item.track.artist}` : ""}`)
      .join(" | ");
    const suffix = items.length > 5 ? ` (+${items.length - 5} más)` : "";
    return `📜 Cola: ${preview}${suffix}`;
  }

  private async handleNowPlaying(roomId: string, ownerId: string): Promise<string> {
    const current = await this.music.getNowPlaying(roomId, ownerId);
    if (!current) return "Nada sonando ahora mismo.";
    return `▶️ Sonando: ${current.track.title}${current.track.artist ? ` — ${current.track.artist}` : ""}`;
  }

  private handleHelp(): string {
    return "Comandos: !play <búsqueda>, !skip, !queue, !nowplaying — solo dueño/mod: !ban <nombre> [motivo], !kick <nombre>, !unban <nombre>";
  }
}
