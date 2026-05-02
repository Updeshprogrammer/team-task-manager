import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import Task from "@/models/Task";
import User from "@/models/User";
import { getSessionUser, assertRole } from "@/lib/auth-context";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { patchProjectSchema } from "@/lib/validators";

export const runtime = "nodejs";

function projectJson(doc) {
  const o = doc.toObject?.() ?? doc;
  const members = Array.isArray(o.members)
    ? o.members.map((m) =>
        typeof m === "object" && m?.email
          ? {
              id: String(m._id),
              name: m.name,
              email: m.email,
              role: m.role,
              isActive: m.isActive,
              avatarUrl: m.avatarUrl ?? null,
            }
          : { id: String(m) }
      )
    : [];
  const owner =
    o.owner?.email !== undefined
      ? {
          id: String(o.owner._id ?? o.owner),
          name: o.owner.name,
          email: o.owner.email,
          role: o.owner.role,
          avatarUrl: o.owner.avatarUrl ?? null,
        }
      : { id: String(o.owner) };
  return {
    id: String(o._id),
    name: o.name,
    description: o.description,
    ownerId: typeof o.owner === "object" && o.owner?._id ? String(o.owner._id) : String(o.owner),
    owner,
    members,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

async function loadProjectAuthorized(id, me) {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { error: jsonErr("Invalid project id", 400) };
  }
  if (!me || !me.isActive) {
    return { error: jsonErr("Unauthorized", 401) };
  }

  const project = await Project.findById(id).populate([
    { path: "owner", select: "name email role avatarUrl" },
    { path: "members", select: "name email role isActive avatarUrl" },
  ]);
  if (!project) {
    return { error: jsonErr("Project not found", 404) };
  }

  if (me.role === "admin") {
    return { project };
  }

  const isMember =
    Array.isArray(project.members) &&
    project.members.some((m) => {
      const mid = typeof m === "object" ? m._id : m;
      return mid.toString() === me.id;
    });

  if (!isMember) {
    return { error: jsonErr("Forbidden", 403) };
  }

  return { project };
}

export async function GET(_request, context) {
  const { id } = await context.params;
  const me = await getSessionUser(false);
  const r = await loadProjectAuthorized(id, me);
  if (r.error) return r.error;
  return jsonOk({ project: projectJson(r.project) });
}

export async function PATCH(request, context) {
  const { id } = await context.params;
  await connectDB();
  const me = await getSessionUser(false);
  const denied = assertRole(me, ["admin"]);
  if (denied) return denied;

  const r = await loadProjectAuthorized(id, me);
  if (r.error) return r.error;

  const body = await request.json().catch(() => ({}));
  const parsed = patchProjectSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, description, memberIds } = parsed.data;
  if (name !== undefined) r.project.name = name;
  if (description !== undefined) r.project.description = description;

  if (memberIds !== undefined) {
    const uniqueMembers = [...new Set(memberIds)];
    const oidSet = uniqueMembers.filter((mid) =>
      mongoose.Types.ObjectId.isValid(mid)
    );
    const candidates = await User.find({
      _id: { $in: oidSet },
      isActive: true,
    });
    if (candidates.length !== oidSet.length) {
      return jsonErr(
        "One or more members are invalid, missing, or inactive",
        400
      );
    }
    r.project.members = oidSet.map((mid) => new mongoose.Types.ObjectId(mid));
  }

  await r.project.save();

  const populated = await Project.findById(r.project._id).populate([
    { path: "owner", select: "name email role avatarUrl" },
    { path: "members", select: "name email role isActive avatarUrl" },
  ]);

  return jsonOk({ project: projectJson(populated) });
}

export async function DELETE(_request, context) {
  const { id } = await context.params;
  await connectDB();
  const me = await getSessionUser(false);
  const denied = assertRole(me, ["admin"]);
  if (denied) return denied;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonErr("Invalid project id", 400);
  }

  await Task.deleteMany({ project: id });
  await Project.deleteOne({ _id: id });
  return jsonOk({ deleted: id });
}
