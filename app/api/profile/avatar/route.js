import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { getSessionUser } from "@/lib/auth-context";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { serializeUser } from "@/lib/serialize";
import { deleteStoredAvatar, extForMime, writeAvatar } from "@/lib/avatar-storage";

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request) {
  try {
    await connectDB();
    const me = await getSessionUser(false);
    if (!me || !me.isActive) {
      return jsonErr("Unauthorized", 401);
    }

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return jsonErr("Expected multipart form data", 400);
    }

    const file = formData.get("avatar") ?? formData.get("photo");
    if (!file || typeof file === "string") {
      return jsonErr('Send an image in the multipart field named "avatar"', 400);
    }

    const type = typeof file.type === "string" ? file.type.toLowerCase() : "";
    const ext = extForMime(type);
    if (!ext) {
      return jsonErr("Unsupported type. Allowed: JPEG, PNG, WebP, GIF.", 400);
    }

    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.byteLength === 0) return jsonErr("Empty file", 400);
    if (buf.byteLength > MAX_BYTES) {
      return jsonErr("Maximum file size is 2 MB", 413);
    }

    await deleteStoredAvatar(me.avatarUrl ?? undefined);

    const publicPath = await writeAvatar(String(me._id), ext, buf);
    me.avatarUrl = publicPath;
    await me.save();

    const fresh = await User.findById(me._id).lean();
    return jsonOk({ user: serializeUser(fresh) });
  } catch (e) {
    console.error(e);
    return jsonErr("Could not update profile photo", 500);
  }
}

export async function DELETE() {
  try {
    await connectDB();
    const me = await getSessionUser(false);
    if (!me || !me.isActive) {
      return jsonErr("Unauthorized", 401);
    }

    await deleteStoredAvatar(me.avatarUrl ?? undefined);
    me.avatarUrl = null;
    await me.save();

    const fresh = await User.findById(me._id).lean();
    return jsonOk({ user: serializeUser(fresh) });
  } catch (e) {
    console.error(e);
    return jsonErr("Could not remove profile photo", 500);
  }
}
