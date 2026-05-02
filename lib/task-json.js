export function taskJson(doc) {
  const o = doc.toObject?.() ?? doc;

  function person(p) {
    if (!p) return null;
    if (typeof p === "object" && p.email) {
      return {
        id: String(p._id),
        name: p.name,
        email: p.email,
        role: p.role,
        isActive: p.isActive,
        avatarUrl: p.avatarUrl ?? null,
      };
    }
    return { id: String(p) };
  }

  const assignee = person(o.assignee);
  const createdBy = person(o.createdBy);
  const proj = o.project;
  const projectBlock =
    typeof proj === "object" && proj?.name
      ? { id: String(proj._id), name: proj.name }
      : { id: String(proj), name: null };

  return {
    id: String(o._id),
    title: o.title,
    description: o.description,
    status: o.status,
    dueDate: o.dueDate ? new Date(o.dueDate).toISOString() : null,
    projectId: typeof proj === "object" && proj?._id ? String(proj._id) : String(o.project),
    projectName: typeof proj === "object" ? proj?.name ?? null : null,
    assigneeId: typeof o.assignee === "object" && o.assignee?._id ? String(o.assignee._id) : String(o.assignee),
    assignee,
    createdById: typeof o.createdBy === "object" && o.createdBy?._id ? String(o.createdBy._id) : String(o.createdBy),
    createdBy,
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
