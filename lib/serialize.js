export function toId(obj) {
  if (!obj) return null;
  return String(obj._id ?? obj);
}

export function serializeUser(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    name: o.name,
    email: o.email,
    role: o.role,
    isActive: o.isActive,
    avatarUrl: o.avatarUrl ?? null,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export function serializeProject(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    name: o.name,
    description: o.description,
    ownerId: String(o.owner),
    memberIds: (o.members || []).map((m) => String(m)),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export function serializeTask(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(o._id),
    title: o.title,
    description: o.description,
    status: o.status,
    dueDate: o.dueDate ? new Date(o.dueDate).toISOString() : null,
    projectId: String(o.project),
    assigneeId: String(o.assignee),
    createdById: String(o.createdBy),
    remarks: (o.remarks || []).map((r) => ({
      id: String(r._id),
      userId: String(r.userId),
      text: r.text,
      createdAt: r.createdAt,
    })),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}
