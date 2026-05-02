import { getSessionUser } from "@/lib/auth-context";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { serializeUser } from "@/lib/serialize";

export async function GET() {
  const user = await getSessionUser(false);
  if (!user || !user.isActive) {
    return jsonErr("Unauthorized", 401);
  }
  return jsonOk({ user: serializeUser(user) });
}
