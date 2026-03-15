import { cookies } from "next/headers";

const AUTH_COOKIE = "redirect-admin-auth";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "admin";
}

export async function verifyPassword(password: string): Promise<boolean> {
  return password === getAdminPassword();
}

export async function setAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  const token = Buffer.from(`authenticated:${getAdminPassword()}`).toString("base64");
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return false;

  try {
    const decoded = Buffer.from(token, "base64").toString();
    return decoded === `authenticated:${getAdminPassword()}`;
  } catch {
    return false;
  }
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}
