import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import type { AppConfig } from "../../../config/configuration";

/**
 * Authenticates the Icecast/Liquidsoap streaming service against
 * `/internal/streaming/*` — it's a trusted server process, not a logged-in
 * user, so it can't carry the usual JWT cookie. A shared secret header
 * (`x-internal-token`) is the simplest thing that works for a single
 * first-party caller.
 */
@Injectable()
export class InternalTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get("streaming.internalToken", { infer: true });
    if (!expected) {
      throw new ServiceUnavailableException("STREAMING_INTERNAL_TOKEN is not configured");
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers["x-internal-token"];
    if (provided !== expected) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
