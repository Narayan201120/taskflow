import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { projectService } from "../services/projects";
import type { ProjectResponse } from "../types";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const load = () => { projectService.list().then(setProjects).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await projectService.create({ name, description: desc || undefined });
      setShowModal(false); setName(""); setDesc("");
      load();
    } finally { setCreating(false); }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Projects</h1><p className="page-subtitle">Manage your team projects</p></div>
        <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Project</button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <h3>No projects yet</h3>
          <p>Create your first project to start organizing tasks</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Project</button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <div className="project-card-name">{p.name}</div>
              <div className="project-card-desc">{p.description || "No description"}</div>
              <div className="project-card-footer">
                <span>👥 {p.member_count} members</span>
                <span>📋 {p.task_count} tasks</span>
                <span>📅 {new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">New Project</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input id="project-name" className="form-input" placeholder="My Project" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea id="project-desc" className="form-textarea" placeholder="What is this project about?" value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="project-submit" type="submit" className="btn btn-primary" disabled={creating}>{creating ? "Creating..." : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
