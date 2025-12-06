import { Elysia } from "elysia";
import { auth } from "@/lib/auth";

export const govtGuard = new Elysia()
  .derive(async ({ request }) => {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    return { authSession: session };
  })
  .onBeforeHandle(({ authSession, set }) => {
    if (!authSession) {
      set.status = 401;
      return "Unauthorized";
    }
    const userRole = (authSession.user as any).role;
    if (userRole !== "GOVT") {
      set.status = 403;
      return "Forbidden: Government Access Required";
    }
  })
  .derive(({ authSession }) => {
    if (!authSession) return {};
    return {
      user: authSession.user,
      session: authSession.session,
    };
  });
