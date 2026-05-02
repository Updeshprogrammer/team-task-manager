import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const profileUpdateSchema = z.object({
  email: z.string().email().max(255),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(4000).optional().default(""),
  memberIds: z.array(z.string().regex(/^[a-fA-F\d]{24}$/)).default([]),
});

export const patchProjectSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(4000).optional(),
  memberIds: z.array(z.string().regex(/^[a-fA-F\d]{24}$/)).optional(),
});

export const taskStatusEnum = z.enum([
  "todo",
  "in_progress",
  "review",
  "done",
]);

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional().default(""),
  projectId: z.string().regex(/^[a-fA-F\d]{24}$/),
  assigneeId: z.string().regex(/^[a-fA-F\d]{24}$/),
  status: taskStatusEnum.optional().default("todo"),
  dueDate: z.string().max(40).nullable().optional(),
});

export const patchTaskAdminSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional(),
  assigneeId: z.string().regex(/^[a-fA-F\d]{24}$/).optional(),
  status: taskStatusEnum.optional(),
  dueDate: z.string().max(40).nullable().optional(),
});

/** Member-only updates */
export const patchTaskMemberSchema = z.object({
  status: taskStatusEnum.optional(),
  remark: z.string().min(1).max(4000).optional(),
}).refine((d) => d.status !== undefined || d.remark !== undefined, {
  message: "Provide status and/or remark",
});

export const userAdminPatchSchema = z.object({
  isActive: z.boolean().optional(),
}).refine((d) => d.isActive !== undefined, {
  message: "Provide isActive",
});
