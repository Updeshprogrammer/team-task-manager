import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { getSessionUser, assertRole } from "@/lib/auth-context";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { createProjectSchema } from "@/lib/validators";

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

export async function GET() {
  await connectDB();
  const me = await getSessionUser(false);
  if (!me || !me.isActive) {
    return jsonErr("Unauthorized", 401);
  }

  let filter = {};
  if (me.role === "member") {
    filter = { members: me._id };
  }

  const list = await Project.find(filter)
    .populate([
      { path: "owner", select: "name email role avatarUrl" },
      { path: "members", select: "name email role isActive avatarUrl" },
    ])
    .sort({ updatedAt: -1 })
    .exec();

  return jsonOk({ projects: list.map(projectJson) });
}

export async function POST(request) {
  await connectDB();
  const me = await getSessionUser(false);
  const denied = assertRole(me, ["admin"]);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { name, description, memberIds } = parsed.data;

  const uniqueMembers = [...new Set(memberIds)];
  const oidSet = uniqueMembers.filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
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

  const project = await Project.create({
    name,
    description: description ?? "",
    owner: me._id,
    members: oidSet.map((id) => new mongoose.Types.ObjectId(id)),
  });

  const populated = await Project.findById(project._id).populate([
    { path: "owner", select: "name email role avatarUrl" },
    { path: "members", select: "name email role isActive avatarUrl" },
  ]);

  return jsonOk({ project: projectJson(populated) }, { status: 201 });
}
