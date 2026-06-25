import { handlers } from "@/lib/auth";
import { revokeUserSessions } from "@/lib/sessionRevocation";
import { logSecurityError } from "@/lib/secureLogger";
import type { NextRequest } from "next/server";

export const GET = handlers.GET;

export async function POST(req: NextRequest): Promise<Response> {
  if (new URL(req.url).pathname.endsWith("/signout")) {
    try {
      const { auth } = await import("@/lib/auth");
      const session = await auth();
      if (session?.user?.id) {
        await revokeUserSessions(session.user.id);
      }
    } catch (error) {
      logSecurityError("auth.signout.revoke", error);
    }
  }
  return handlers.POST(req);
}
