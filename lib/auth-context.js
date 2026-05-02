import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { jsonErr } from "@/lib/api-response";

export async function getSessionUser(includePassword = false) {
  let token;
  try {
    const store = await cookies();
    token = store.get("token")?.value;
  } catch {
    return null;
  }
  const payload = await verifyToken(token);
  const id = typeof payload?.sub === "string" ? payload.sub : null;
  if (!id) return null;

  await connectDB();
  const q = User.findById(id);
  if (includePassword) {
    q.select("+passwordHash");
  }
  return q.exec();
}

/**
 * @param {import('mongoose').Document & { role?: string; isActive?: boolean }} user
 * @param {('admin'|'member')[]} allowedRoles
 */
export function assertRole(user, allowedRoles) {
  if (!user || !user.isActive) {
    return jsonErr("Unauthorized", 401);
  }
  if (!allowedRoles.includes(user.role)) {
    return jsonErr("Forbidden", 403);
  }
  return null;
}
