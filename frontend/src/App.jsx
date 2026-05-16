import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000/api/tasks/";

// Format date to Philippine Standard Time (UTC+8)
function formatPHTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error();
      setTasks(await res.json());
    } catch {
      setError("Could not connect to the API. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    setError("");
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), is_completed: false }),
      });
      if (!res.ok) throw new Error();
      const newTask = await res.json();
      setTasks((prev) => [newTask, ...prev]);
      setTitle("");
    } catch {
      setError("Could not add task. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleToggle(task) {
    setTogglingId(task.id);
    try {
      const res = await fetch(`${API_URL}${task.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_completed: !task.is_completed }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      setError("Could not update task.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}${id}/`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error();
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Could not delete task.");
    } finally {
      setDeletingId(null);
    }
  }

  const total = tasks.length;
  const completed = tasks.filter((t) => t.is_completed).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="page">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            TaskFlow
          </div>

        </div>
      </header>

      <main className="main">

        {/* Progress card */}
        {total > 0 && (
          <section className="card progress-card">
            <div className="progress-top">
              <div>
                <p className="progress-label">Overall Progress</p>
                <p className="progress-fraction">{completed} of {total} tasks completed</p>
              </div>
              <div className="progress-pct">{pct}%</div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="progress-stats">
              <span className="stat"><span className="stat-dot dot-pending" />{total - completed} pending</span>
              <span className="stat"><span className="stat-dot dot-done" />{completed} completed</span>
            </div>
          </section>
        )}

        {/* Add task */}
        <section className="card add-card">
          <h2 className="section-title">New Task</h2>
          <form className="add-form" onSubmit={handleAdd}>
            <div className="input-row">
              <div className="input-wrapper">
                <svg className="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                <input
                  type="text"
                  className="task-input"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={adding}
                />
              </div>
              <button type="submit" className="btn-add" disabled={adding || !title.trim()}>
                {adding ? <span className="spinner" /> : <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add Task
                </>}
              </button>
            </div>
          </form>
          {error && (
            <p className="error-msg">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </p>
          )}
        </section>

        {/* Task list */}
        <section className="card list-card">
          <h2 className="section-title">All Tasks</h2>

          {loading ? (
            <div className="skeletons">
              <div className="skeleton" /><div className="skeleton" style={{width:"80%"}}/><div className="skeleton" style={{width:"60%"}}/>
            </div>
          ) : tasks.length === 0 ? (
            <div className="empty">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6M12 9v6"/>
              </svg>
              <p>No tasks yet — add one above!</p>
            </div>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => (
                <li key={task.id} className={`task-item ${task.is_completed ? "is-done" : ""} ${togglingId === task.id ? "is-toggling" : ""}`}>

                  {/* Checkbox */}
                  <button
                    className={`check-btn ${task.is_completed ? "checked" : ""}`}
                    onClick={() => handleToggle(task)}
                    disabled={togglingId === task.id || deletingId === task.id}
                    title={task.is_completed ? "Mark as pending" : "Mark as complete"}
                  >
                    {togglingId === task.id ? (
                      <span className="spinner spinner-sm spinner-brand" />
                    ) : task.is_completed ? (
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    ) : null}
                  </button>

                  {/* Title + date */}
                  <div className="task-body">
                    <span className="task-title">{task.title}</span>
                    {task.created_at && (
                      <span className="task-date">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                        </svg>
                        {formatPHTime(task.created_at)}
                      </span>
                    )}
                  </div>

                  {/* Status pill */}
                  <span className={`pill ${task.is_completed ? "pill-done" : "pill-pending"}`}>
                    {task.is_completed ? "Done" : "Pending"}
                  </span>

                  {/* Delete */}
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(task.id)}
                    disabled={deletingId === task.id || togglingId === task.id}
                    title="Delete task"
                  >
                    {deletingId === task.id ? (
                      <span className="spinner spinner-sm" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                      </svg>
                    )}
                  </button>

                </li>
              ))}
            </ul>
          )}
        </section>

      </main>
    </div>
  );
}
