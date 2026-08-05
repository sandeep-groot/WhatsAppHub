import type { CookieOptions, Response } from 'express';

export const AUTH_COOKIE = {
  access: 'access_token',
  refresh: 'refresh_token',
} as const;

/** Converts a JWT-style expiry string (e.g. `15m`, `7d`) to seconds for Max-Age. */
export function expiryToMaxAgeSeconds(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) {
    return 7 * 24 * 60 * 60;
  }
  const value = Number(match[1]);
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };
  return value * (multipliers[match[2]] ?? 1);
}

function baseCookieOptions(
  maxAgeSeconds: number,
  secure: boolean,
): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  };
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  options: {
    accessMaxAgeSeconds: number;
    refreshMaxAgeSeconds: number;
    secure: boolean;
  },
): void {
  res.cookie(
    AUTH_COOKIE.access,
    tokens.accessToken,
    baseCookieOptions(options.accessMaxAgeSeconds, options.secure),
  );
  res.cookie(
    AUTH_COOKIE.refresh,
    tokens.refreshToken,
    baseCookieOptions(options.refreshMaxAgeSeconds, options.secure),
  );
}

export function clearAuthCookies(res: Response, secure: boolean): void {
  const pastDate = new Date(0);
  const optionsList: CookieOptions[] = [
    { httpOnly: true, secure, sameSite: secure ? 'none' : 'lax', path: '/', maxAge: 0, expires: pastDate },
    { httpOnly: true, secure: true, sameSite: 'none', path: '/', maxAge: 0, expires: pastDate },
    { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 0, expires: pastDate },
  ];

  for (const opts of optionsList) {
    res.clearCookie(AUTH_COOKIE.access, opts);
    res.clearCookie(AUTH_COOKIE.refresh, opts);
  }
}
