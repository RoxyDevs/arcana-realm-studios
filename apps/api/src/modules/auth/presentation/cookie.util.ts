import type { Response } from "express";
import type { AuthTokensDto } from "@arcana/types";

const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export function setAuthCookies(res: Response, tokens: AuthTokensDto, isProduction: boolean): void {
  res.cookie("access_token", tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: tokens.expiresIn * 1000,
  });
  res.cookie("refresh_token", tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/auth",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token", { path: "/auth" });
}
