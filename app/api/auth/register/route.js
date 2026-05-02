import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { registerSchema } from "@/lib/validators";
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
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }
    const { name, email, password } = parsed.data;
    await connectDB();

    const exists = await User.findOne({ email });
    if (exists) {
      return jsonErr("Email already registered", 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: "member",
      isActive: true,
    });

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
