import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Project from "@/models/Project";
import Task from "@/models/Task";
import { getSessionUser, assertRole } from "@/lib/auth-context";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { userAdminPatchSchema } from "@/lib/validators";

function isOid(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function PATCH(request, context) {
  await connectDB();
  const me = await getSessionUser(false);
  const denied = assertRole(me, ["admin"]);
  if (denied) return denied;

  const { id: targetId } = await context.params;
  if (!isOid(targetId)) {
    return jsonErr("Invalid user id", 400);
  }
  const body = await request.json().catch(() => ({}));
  const parsed = userAdminPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  if (targetId === me.id) {
    return jsonErr("You cannot deactivate or change your own account here", 400);
  }

  const update = parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {};
  const updated = await User.findByIdAndUpdate(targetId, update, {
    new: true,
    runValidators: true,
  });
  if (!updated) {
    return jsonErr("User not found", 404);
  }

  const u = updated.toObject();
  return jsonOk({
    user: {
      id: String(u._id),
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    },
  });
}

export async function DELETE(_request, context) {
  await connectDB();
  const me = await getSessionUser(false);
  const denied = assertRole(me, ["admin"]);
  if (denied) return denied;

  const { id: targetId } = await context.params;
  if (!isOid(targetId)) {
    return jsonErr("Invalid user id", 400);
  }

  if (targetId === me.id) {
    return jsonErr("You cannot delete your own account", 400);
  }

  const fallbackAdmin = await User.findOne({
    role: "admin",
    _id: { $ne: new mongoose.Types.ObjectId(targetId) },
    isActive: true,
  }).sort({ createdAt: 1 });

  await Project.updateMany(
    { owner: targetId },
    { $set: { owner: fallbackAdmin?._id ?? me._id } }
  );

  await Project.updateMany({}, { $pull: { members: targetId } });

  const tasks = await Task.find({
    $or: [
      { assignee: targetId },
      { createdBy: targetId },
    ],
  }).populate("project");

  for (const t of tasks) {
    const proj = t.project;
    let owner =
      proj && proj.owner?.toString
        ? proj.owner
        : fallbackAdmin?._id ?? me._id;
    if (t.assignee.toString() === targetId) {
      t.assignee = owner;
    }
    if (t.createdBy?.toString() === targetId) {
      t.createdBy = owner;
    }
    await t.save();
  }

  await User.deleteOne({ _id: targetId });

  const remainingAdmins = await User.countDocuments({ role: "admin" });
  if (remainingAdmins === 0) {
    console.warn("[users] Deleted user was last admin; promote someone via seed/setup.");
  }

  return jsonOk({ deleted: targetId });
}
