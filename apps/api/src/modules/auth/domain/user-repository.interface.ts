import type { User } from "@arcana/database";
import type { DiscordProfile } from "./discord-profile.entity";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByDiscordId(discordId: string): Promise<User | null>;
  createFromDiscordProfile(profile: DiscordProfile): Promise<User>;
  /** Case-insensitive username substring search, for admins looking up a user to grant credits/subscriptions to. */
  searchByUsername(query: string, limit: number): Promise<User[]>;
}
