import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-context";
import { NextResponse } from "next/server";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { profileUpdateSchema } from "@/lib/validators";
import { serializeUser } from "@/lib/serialize";

/** Authenticated member (or admin) updates their own profile email */
export async function PATCH(request) {
  try {
    await connectDB();
    const me = await getSessionUser(false);
    if (!me || !me.isActive) {
      return jsonErr("Unauthorized", 401);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const taken = await User.findOne({
      email: parsed.data.email,
      _id: { $ne: me._id },
    });
    if (taken) {
      return jsonErr("That email is already in use", 409);
    }

    me.email = parsed.data.email;
    await me.save();

    return jsonOk({ user: serializeUser(me) });
  } catch (e) {
    console.error(e);
    return jsonErr("Server error", 500);
  }
}
