import type { Response } from "express";
import type { AuthTokensDto } from "@arcana/types";

const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// The web app (vercel.app) and API (railway.app) live on different
// registrable domains, so this is a cross-site relationship from the
// browser's point of view. SameSite=Lax cookies are withheld from
// cross-site fetch/XHR (only sent on top-level navigations), which broke
// /auth/me right after login. SameSite=None is required for the SPA's
// `credentials: "include"` fetches to actually carry the cookie — and
// browsers reject None cookies without Secure, so it's only safe to use
// once we're on HTTPS (production). Local dev (http://localhost) keeps Lax,
// where same-site cookies work fine as-is.
function sameSitePolicy(isProduction: boolean): "none" | "lax" {
  return isProduction ? "none" : "lax";
}

export function setAuthCookies(res: Response, tokens: AuthTokensDto, isProduction: boolean): void {
  res.cookie("access_token", tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSitePolicy(isProduction),
    maxAge: tokens.expiresIn * 1000,
  });
  res.cookie("refresh_token", tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSitePolicy(isProduction),
    path: "/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response, isProduction: boolean): void {
  res.clearCookie("access_token", { sameSite: sameSitePolicy(isProduction), secure: isProduction });
  res.clearCookie("refresh_token", { path: "/auth", sameSite: sameSitePolicy(isProduction), secure: isProduction });
}
