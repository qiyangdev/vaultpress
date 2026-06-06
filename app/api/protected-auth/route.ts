import { getAuthToken, PROTECTED_COOKIE, verifyPassword } from "@/lib/protected";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };
  const password = body.password?.trim();

  if (!password || !verifyPassword(password)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const token = getAuthToken();
  if (!token) {
    return Response.json({ ok: false }, { status: 503 });
  }

  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${PROTECTED_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );

  return response;
}
