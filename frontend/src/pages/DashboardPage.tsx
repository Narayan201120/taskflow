import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService } from "../services/dashboard";
import { projectService } from "../services/projects";
import type { DashboardStats, ProjectResponse, TaskResponse } from "../types";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [myTasks, setMyTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([dashboardService.getStats(), projectService.list(), dashboardService.getMyTasks()])
      .then(([s, p, t]) => { setStats(s); setProjects(p); setMyTasks(t); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const formatDate = (d: string | null) => {
    if (!d) return "No due date";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isOverdue = (d: string | null, status: string) => {
    if (!d || status === "done") return false;
    return new Date(d) < new Date();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your projects and tasks</p>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Projects</div>
            <div className="stat-value accent">{stats.total_projects}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Tasks</div>
            <div className="stat-value info">{stats.total_tasks}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">To Do</div>
            <div className="stat-value info">{stats.tasks_todo}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value warning">{stats.tasks_in_progress}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Completed</div>
            <div className="stat-value success">{stats.tasks_done}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Overdue</div>
            <div className="stat-value danger">{stats.overdue_tasks}</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Recent Projects */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Your Projects</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate("/projects")}>View All</button>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state"><h3>No projects yet</h3><p>Create your first project to get started</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {projects.slice(0, 5).map(p => (
                <div key={p.id} className="task-item" onClick={() => navigate(`/projects/${p.id}`)} style={{ gridTemplateColumns: "1fr auto auto" }}>
                  <div>
                    <div className="task-title">{p.name}</div>
                    <div className="task-meta">{p.description || "No description"}</div>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.member_count} members</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.task_count} tasks</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">My Tasks</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{myTasks.length} assigned</span>
          </div>
          {myTasks.length === 0 ? (
            <div className="empty-state"><h3>No tasks assigned</h3><p>Tasks assigned to you will appear here</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {myTasks.slice(0, 8).map(t => (
                <div key={t.id} className="task-item" onClick={() => navigate(`/projects/${t.project_id}`)} style={{ gridTemplateColumns: "1fr auto auto" }}>
                  <div>
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta" style={{ color: isOverdue(t.due_date, t.status) ? "var(--danger)" : undefined }}>{formatDate(t.due_date)}</div>
                  </div>
                  <span className={`badge badge-${t.status}`}>{t.status.replace("_", " ")}</span>
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
