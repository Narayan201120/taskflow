import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", username: "", full_name: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      await signup(form.email, form.username, form.full_name, form.password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">Start managing your team's tasks</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="signup-name" className="form-input" placeholder="John Doe" value={form.full_name} onChange={set("full_name")} required />
          </div>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input id="signup-username" className="form-input" placeholder="johndoe" value={form.username} onChange={set("username")} required minLength={3} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input id="signup-email" className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="signup-password" className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set("password")} required minLength={6} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input id="signup-confirm" className="form-input" type="password" placeholder="Repeat password" value={form.confirm} onChange={set("confirm")} required />
          </div>
          <button id="signup-submit" className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
