import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import Task from "@/models/Task";
import { getSessionUser } from "@/lib/auth-context";
import { jsonOk, jsonErr } from "@/lib/api-response";
import { patchTaskAdminSchema, patchTaskMemberSchema } from "@/lib/validators";
import { taskJson } from "@/lib/task-json";

export const runtime = "nodejs";

async function loadPopulated(taskId) {
  return Task.findById(taskId)
    .populate({ path: "assignee", select: "name email role isActive avatarUrl" })
    .populate({ path: "createdBy", select: "name email role isActive avatarUrl" })
    .populate({ path: "project", select: "name" });
}

function canViewTask(me, task) {
  if (me.role === "admin") return true;
  return task.assignee._id?.toString() === me.id ||
    task.assignee.toString?.() === me.id;
}

export async function GET(_request, context) {
  await connectDB();
  const me = await getSessionUser(false);
  if (!me || !me.isActive) {
    return jsonErr("Unauthorized", 401);
  }

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonErr("Invalid task id", 400);
  }

  const task = await loadPopulated(id);
  if (!task) {
    return jsonErr("Task not found", 404);
  }
  if (!canViewTask(me, task)) {
    return jsonErr("Forbidden", 403);
  }

  return jsonOk({ task: taskJson(task) });
}

export async function PATCH(request, context) {
  await connectDB();
  const me = await getSessionUser(false);
  if (!me || !me.isActive) {
    return jsonErr("Unauthorized", 401);
  }

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonErr("Invalid task id", 400);
  }

  const task = await Task.findById(id).populate("project");
  if (!task) {
    return jsonErr("Task not found", 404);
  }

  if (me.role === "admin") {
    const body = await request.json().catch(() => ({}));
    const parsed = patchTaskAdminSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { ok: false, errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { title, description, assigneeId, status, dueDate } = parsed.data;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === "") {
        task.dueDate = undefined;
      } else {
        const d = new Date(dueDate);
        if (Number.isNaN(d.getTime())) return jsonErr("Invalid due date", 400);
        task.dueDate = d;
      }
    }

    if (assigneeId !== undefined) {
      const pid =
        typeof task.project === "object" && task.project?._id
          ? task.project._id
          : task.project;
      const p = await Project.findById(pid).populate("members");
      if (!p) return jsonErr("Project not found for this task", 400);
      const memberStrings = [
        ...(p.members || []).map((m) =>
          typeof m?.toHexString === "function" ? m.toString() : String(m._id ?? m)
        ),
        p.owner?.toHexString?.() ?? String(p.owner),
      ];
      if (!memberStrings.includes(assigneeId)) {
        return jsonErr(
          "Assignee must be the project owner or a project member",
          400
        );
      }
      task.assignee = assigneeId;
    }

    await task.save();
    const refreshed = await loadPopulated(task._id);
    return jsonOk({ task: taskJson(refreshed) });
  }

  /** Member branch */
  if (task.assignee.toString() !== me.id) {
    return jsonErr("Forbidden — only assignee can update", 403);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = patchTaskMemberSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, errors: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  if (parsed.data.status !== undefined) {
    task.status = parsed.data.status;
  }
  if (parsed.data.remark !== undefined) {
    task.remarks.push({
      userId: me._id,
      text: parsed.data.remark,
    });
  }
  await task.save();

  const refreshed = await loadPopulated(task._id);
  return jsonOk({ task: taskJson(refreshed) });
}

/** DELETE task — admins only */
export async function DELETE(_request, context) {
  await connectDB();
  const me = await getSessionUser(false);
  if (!me || !me.isActive) return jsonErr("Unauthorized", 401);
  if (me.role !== "admin") return jsonErr("Forbidden", 403);

  const { id } = await context.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return jsonErr("Invalid task id", 400);
  }

  const res = await Task.deleteOne({ _id: id });
  if (!res.deletedCount) return jsonErr("Task not found", 404);
  return jsonOk({ deleted: id });
}
