import { useEffect, useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { projectService } from "../services/projects";
import { taskService } from "../services/tasks";
import type { ProjectDetailResponse, TaskResponse, TaskCreate } from "../types";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectDetailResponse | null>(null);
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"tasks" | "members">("tasks");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState<TaskCreate>({ title: "", priority: "medium" });
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"admin" | "member">("member");
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const isAdmin = project?.members.some(m => m.user_id === user?.id && m.role === "admin") ?? false;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = async () => {
    if (!id) return;
    try {
      const [p, t] = await Promise.all([projectService.get(id), taskService.list(id)]);
      setProject(p); setTasks(t);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault(); setError("");
    if (!id) return;
    try {
      await taskService.create(id, taskForm);
      setShowTaskModal(false); setTaskForm({ title: "", priority: "medium" });
      showToast("Task created successfully"); load();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed to create task"); }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    if (!id) return;
    await taskService.update(id, taskId, { status: status as any });
    const label = status === "done" ? "completed" : status === "in_progress" ? "started" : "moved";
    showToast(`Task ${label}`); load();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!id || !confirm("Delete this task?")) return;
    await taskService.delete(id, taskId); showToast("Task deleted"); load();
  };

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault(); setError("");
    if (!id) return;
    try {
      await projectService.addMember(id, { email: memberEmail, role: memberRole });
      setShowMemberModal(false); setMemberEmail("");
      showToast("Member added successfully"); load();
    } catch (err: any) { setError(err.response?.data?.detail || "Failed to add member"); }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id || !confirm("Remove this member?")) return;
    await projectService.removeMember(id, userId); showToast("Member removed"); load();
  };

  const handleDeleteProject = async () => {
    if (!id || !confirm("Delete this project? This cannot be undone.")) return;
    await projectService.delete(id); navigate("/projects");
  };

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const isOverdue = (d: string | null, s: string) => d && s !== "done" && new Date(d) < new Date();

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>;

  const grouped = { todo: tasks.filter(t => t.status === "todo"), in_progress: tasks.filter(t => t.status === "in_progress"), done: tasks.filter(t => t.status === "done") };

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.type === "success" ? "✓" : "✕"} {toast.msg}</div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex-center">
            <button className="btn-icon" onClick={() => navigate("/projects")}>←</button>
            <h1 className="page-title">{project.name}</h1>
          </div>
          <p className="page-subtitle">{project.description || "No description"}</p>
        </div>
        <div className="flex-gap-sm">
          {tab === "tasks" && <button className="btn btn-primary" onClick={() => { setShowTaskModal(true); setTaskForm({ title: "", priority: "medium" }); setError(""); }}>+ Add Task</button>}
          {tab === "members" && isAdmin && <button className="btn btn-primary" onClick={() => { setShowMemberModal(true); setError(""); }}>+ Add Member</button>}
          {isAdmin && <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>Delete Project</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === "tasks" ? "active" : ""}`} onClick={() => setTab("tasks")}>Tasks ({tasks.length})</button>
        <button className={`tab ${tab === "members" ? "active" : ""}`} onClick={() => setTab("members")}>Members ({project.members.length})</button>
      </div>

      {/* Tasks Tab - Kanban Board */}
      {tab === "tasks" && (
        tasks.length === 0 ? (
          <div className="empty-state">
            <h3>No tasks yet</h3>
            <p>Create your first task to start tracking progress</p>
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>Create Task</button>
          </div>
        ) : (
          <div className="kanban-board">
            {(["todo", "in_progress", "done"] as const).map(status => (
              <div key={status} className="kanban-column">
                <div className="kanban-column-header">
                  <span className={`badge badge-${status}`}>{status.replace("_", " ")}</span>
                  <span className="kanban-column-count">{grouped[status].length}</span>
                </div>
                <div className="kanban-cards">
                  {grouped[status].map(task => (
                    <div key={task.id} className="kanban-card">
                      <div className="kanban-card-header">
                        <span className="task-title">{task.title}</span>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </div>
                      {task.description && <p className="kanban-card-desc">{task.description}</p>}
                      <div className={`kanban-card-meta${isOverdue(task.due_date, task.status) ? " overdue" : ""}`}>
                        <span>📅 {formatDate(task.due_date)}</span>
                        {task.assignee && <span>👤 {task.assignee.full_name}</span>}
                      </div>
                      <div className="kanban-card-actions">
                        {status !== "todo" && <button className="btn btn-sm btn-secondary" onClick={() => handleUpdateStatus(task.id, status === "done" ? "in_progress" : "todo")}>← Back</button>}
                        {status !== "done" && <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(task.id, status === "todo" ? "in_progress" : "done")}>{status === "todo" ? "Start" : "Done"} →</button>}
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTask(task.id)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Members Tab */}
      {tab === "members" && (
        <div className="members-list">
          {project.members.map(m => (
            <div key={m.id} className="member-item">
              <div className="user-avatar">{m.user.full_name[0]}</div>
              <div className="member-info">
                <div className="member-name">{m.user.full_name}</div>
                <div className="member-email">{m.user.email}</div>
              </div>
              <span className={`badge badge-${m.role}`}>{m.role}</span>
              {isAdmin && m.user_id !== user?.id && (
                <button className="btn btn-sm btn-danger" onClick={() => handleRemoveMember(m.user_id)}>Remove</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">New Task</h3>
              <button className="btn-icon" onClick={() => setShowTaskModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreateTask}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input className="form-input" placeholder="Task title" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" placeholder="Optional description" value={taskForm.description || ""} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as any }))}>
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input className="form-input" type="date" value={taskForm.due_date?.split("T")[0] || ""} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign to</label>
                  <select className="form-select" value={taskForm.assigned_to_id || ""} onChange={e => setTaskForm(f => ({ ...f, assigned_to_id: e.target.value || undefined }))}>
                    <option value="">Unassigned</option>
                    {project.members.map(m => <option key={m.user_id} value={m.user_id}>{m.user.full_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Member</h3>
              <button className="btn-icon" onClick={() => setShowMemberModal(false)}>✕</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleAddMember}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input className="form-input" type="email" placeholder="member@example.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={memberRole} onChange={e => setMemberRole(e.target.value as any)}>
                    <option value="member">Member</option><option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
