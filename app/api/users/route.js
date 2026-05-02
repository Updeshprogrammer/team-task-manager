import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSessionUser, assertRole } from "@/lib/auth-context";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { serializeUser } from "@/lib/serialize";

export const runtime = "nodejs";

/** Admin: list all users (profiles for management & assignment pickers) */
export async function GET() {
  await connectDB();
  const me = await getSessionUser(false);
  const denied = assertRole(me, ["admin"]);
  if (denied) return denied;

  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  return jsonOk({
    users: users.map((u) => serializeUser(u)),
  });
}
