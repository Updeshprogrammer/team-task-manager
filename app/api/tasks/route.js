import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import Task from "@/models/Task";
import { getSessionUser, assertRole } from "@/lib/auth-context";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { createTaskSchema } from "@/lib/validators";
import { taskJson } from "@/lib/task-json";

async function populateTaskQuery(q) {
  return q
    .populate({ path: "assignee", select: "name email role isActive avatarUrl" })
    .populate({ path: "createdBy", select: "name email role isActive avatarUrl" })
    .populate({ path: "project", select: "name" })
    .sort({ dueDate: 1, createdAt: -1 })
    .exec();
}

/** GET: admin sees all tasks (optional ?projectId=); member sees assigned tasks only */
export async function GET(request) {
  await connectDB();
  const me = await getSessionUser(false);
  if (!me || !me.isActive) {
    return jsonErr("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  let filter = {};
  if (me.role === "member") {
    filter.assignee = me._id;
  }

  if (projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return jsonErr("Invalid project id", 400);
    }
    filter.project = projectId;
    if (me.role === "member") {
      const project = await Project.findById(projectId);
      if (!project || !project.members.some((mid) => mid.toString() === me.id)) {
        return jsonErr("Forbidden", 403);
      }
    }
  }

  const list = await populateTaskQuery(Task.find(filter));
  return jsonOk({ tasks: list.map((task) => taskJson(task)) });
}

/** POST create task — admin only; assignee must belong to project's team */
export async function POST(request) {
  await connectDB();
  const me = await getSessionUser(false);
  const denied = assertRole(me, ["admin"]);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { title, description, projectId, assigneeId, status } = parsed.data;

  const project = await Project.findById(projectId).populate("members");
  if (!project) {
    return jsonErr("Project not found", 404);
  }

  const memberStrings = [
    ...project.members.map((m) =>
      typeof m?.toHexString === "function" ? m.toString() : String(m._id ?? m)
    ),
    project.owner?.toHexString?.() ?? String(project.owner),
  ];
  if (!memberStrings.includes(assigneeId)) {
    return jsonErr("Assignee must be the project owner or a project member", 400);
  }

  let dueDate;
  if (parsed.data.dueDate !== undefined && parsed.data.dueDate !== null && parsed.data.dueDate !== "") {
    const d = new Date(parsed.data.dueDate);
    if (Number.isNaN(d.getTime())) {
      return jsonErr("Invalid due date", 400);
    }
    dueDate = d;
  }

  const taskDoc = await Task.create({
    title,
    description: description ?? "",
    project: projectId,
    assignee: assigneeId,
    createdBy: me._id,
    status,
    dueDate,
    remarks: [],
  });

  const populated = await Task.findById(taskDoc._id)
    .populate({ path: "assignee", select: "name email role isActive avatarUrl" })
    .populate({ path: "createdBy", select: "name email role isActive avatarUrl" })
    .populate({ path: "project", select: "name" });

  return jsonOk({ task: taskJson(populated) }, { status: 201 });
}
