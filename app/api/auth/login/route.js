import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { loginSchema } from "@/lib/validators";
import { jsonErr, jsonOk } from "@/lib/api-response";
import { signToken } from "@/lib/jwt";

export const runtime = "nodejs";

function safeServerMisconfigMessage(e) {
  const msg = typeof e?.message === "string" ? e.message : "";
  if (msg.includes("MONGODB_URI")) return "Server misconfigured: MONGODB_URI is missing";
  if (msg.includes("JWT_SECRET")) return "Server misconfigured: JWT_SECRET is missing";
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonErr("Invalid credentials", 422);
    }
    const { email, password } = parsed.data;
    await connectDB();

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      return jsonErr("Invalid email or password", 401);
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return jsonErr("Invalid email or password", 401);
    }
    if (!user.isActive) {
      return jsonErr("Your account has been deactivated", 403);
    }

    const token = await signToken({
      sub: user.id,
      role: user.role,
    });

    const res = jsonOk({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatarUrl: user.avatarUrl ?? null,
      },
    });
    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (e) {
    console.error(e);
    const configMsg = safeServerMisconfigMessage(e);
    if (configMsg) return jsonErr(configMsg, 500);
    return jsonErr("Server error", 500);
  }
}
