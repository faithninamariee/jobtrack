import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  BriefcaseBusiness, Building2, CalendarDays, ChevronDown, ExternalLink,
  Filter, LayoutDashboard, LogOut, MapPin, Pencil, Plus, Search,
  Trash2, UserRound, X, CheckCircle2, Clock3, CircleAlert, RefreshCw
} from "lucide-react";
import "./styles.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const STATUSES = ["Applied","Initial Interview","Technical Interview","Final Interview","Accepted","Rejected"];
const JOB_TYPES = ["Remote","Hybrid","Onsite"];
const CLASSIFICATIONS = ["Part time","Fulltime","Contractual"];
const SOURCES = ["LinkedIn","JobStreet","Indeed","Kalibrr","Email","Facebook","Company Website","Referral","Other"];

const emptyForm = {
  position:"", company:"", salary_range:"", location:"",
  job_type:"Remote", job_classification:"Fulltime",
  date_posted:"", date_applied:new Date().toISOString().slice(0,10),
  status:"Applied", notes:"", source:"LinkedIn",
  job_post_link:"", roles_responsibilities:""
};

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [apps, setApps] = useState([]);
  const [view, setView] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!supabase) { setConfigError(true); setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) loadApplications();
    else setApps([]);
  }, [session]);

  async function loadApplications() {
    setBusy(true);
    const { data, error } = await supabase.from("applications").select("*").order("date_applied", { ascending:false }).order("created_at", { ascending:false });
    if (error) setNotice(error.message);
    else setApps(data || []);
    setBusy(false);
  }

  async function handleAuth(e) {
    e.preventDefault();
    setAuthBusy(true); setAuthMessage("");
    if (!supabase) return;
    const result = authMode === "login"
      ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      : await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (result.error) setAuthMessage(result.error.message);
    else if (authMode === "signup" && !result.data.session) setAuthMessage("Account created. Check your email to confirm your account, then sign in.");
    else setAuthMessage("Signed in successfully.");
    setAuthBusy(false);
  }

  async function signOut() { await supabase.auth.signOut(); }

  function openAdd() {
    setEditingId(null); setForm({...emptyForm}); setModalOpen(true);
  }

  function openEdit(app) {
    setEditingId(app.id);
    setForm({
      position:app.position || "", company:app.company || "", salary_range:app.salary_range || "",
      location:app.location || "", job_type:app.job_type || "Remote",
      job_classification:app.job_classification || "Fulltime", date_posted:app.date_posted || "",
      date_applied:app.date_applied || "", status:app.status || "Applied",
      notes:app.notes || "", source:app.source || "LinkedIn",
      job_post_link:app.job_post_link || "", roles_responsibilities:app.roles_responsibilities || ""
    });
    setModalOpen(true);
  }

  async function saveApplication(e) {
    e.preventDefault();
    if (!form.position.trim() || !form.company.trim()) return;
    setBusy(true); setNotice("");
    const payload = {...form, user_id:session.user.id};
    const result = editingId
      ? await supabase.from("applications").update(payload).eq("id", editingId).select().single()
      : await supabase.from("applications").insert(payload).select().single();
    if (result.error) setNotice(result.error.message);
    else {
      setModalOpen(false);
      await loadApplications();
      setNotice(editingId ? "Application updated." : "Application added.");
    }
    setBusy(false);
  }

  async function deleteApplication(id) {
    if (!confirm("Delete this application?")) return;
    setBusy(true);
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) setNotice(error.message);
    else { setApps(prev => prev.filter(a => a.id !== id)); setNotice("Application deleted."); }
    setBusy(false);
  }

  const filtered = useMemo(() => apps.filter(a => {
    const haystack = [a.position,a.company,a.location,a.notes,a.roles_responsibilities].join(" ").toLowerCase();
    return haystack.includes(search.toLowerCase())
      && (statusFilter === "All" || a.status === statusFilter)
      && (sourceFilter === "All" || a.source === sourceFilter);
  }), [apps, search, statusFilter, sourceFilter]);

  const counts = useMemo(() => Object.fromEntries(STATUSES.map(s => [s, apps.filter(a => a.status === s).length])), [apps]);
  const active = apps.filter(a => !["Accepted","Rejected"].includes(a.status)).length;
  const interviews = apps.filter(a => a.status?.includes("Interview")).length;

  if (loading) return <div className="screen-center"><div className="spinner"></div><span>Loading JobTrack…</span></div>;
  if (configError) return <ConfigHelp />;

  if (!session) return (
    <AuthScreen mode={authMode} setMode={setAuthMode} email={authEmail} setEmail={setAuthEmail}
      password={authPassword} setPassword={setAuthPassword} message={authMessage}
      busy={authBusy} onSubmit={handleAuth}/>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">J</div><div><strong>JobTrack</strong><span>Career command center</span></div></div>
        <nav>
          <button className={view==="dashboard"?"nav active":"nav"} onClick={()=>setView("dashboard")}><LayoutDashboard size={18}/> Dashboard</button>
          <button className={view==="applications"?"nav active":"nav"} onClick={()=>setView("applications")}><BriefcaseBusiness size={18}/> Applications <span className="nav-count">{apps.length}</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="account"><UserRound size={16}/><div><span>Signed in as</span><strong>{session.user.email}</strong></div></div>
          <button className="nav" onClick={signOut}><LogOut size={18}/> Sign out</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><h1>{view==="dashboard" ? "Dashboard" : "Applications"}</h1><p>{view==="dashboard" ? "Keep your job search organized, one application at a time." : "Track every opportunity from application to outcome."}</p></div>
          <button className="primary-btn" onClick={openAdd}><Plus size={18}/> Add application</button>
        </header>

        {notice && <div className="notice">{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}

        {view==="dashboard" ? (
          <Dashboard apps={apps} counts={counts} active={active} interviews={interviews} onAdd={openAdd}/>
        ) : (
          <ApplicationsView apps={filtered} search={search} setSearch={setSearch} statusFilter={statusFilter} setStatusFilter={setStatusFilter}
            sourceFilter={sourceFilter} setSourceFilter={setSourceFilter} onEdit={openEdit} onDelete={deleteApplication}
            onClear={()=>{setSearch("");setStatusFilter("All");setSourceFilter("All")}}/>
        )}
      </main>

      {modalOpen && <ApplicationModal form={form} setForm={setForm} editing={!!editingId} onClose={()=>setModalOpen(false)} onSubmit={saveApplication} busy={busy}/>}
    </div>
  );
}

function AuthScreen({mode,setMode,email,setEmail,password,setPassword,message,busy,onSubmit}) {
  return <div className="auth-page"><div className="auth-card">
    <div className="brand auth-brand"><div className="brand-mark">J</div><div><strong>JobTrack</strong><span>Your job-search command center</span></div></div>
    <h1>{mode==="login" ? "Welcome back" : "Create your account"}</h1>
    <p className="muted">{mode==="login" ? "Sign in to access your applications from anywhere." : "Create an account to securely save your job applications in Supabase."}</p>
    <form onSubmit={onSubmit}>
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" minLength="6" required/></label>
      {message && <div className="auth-message">{message}</div>}
      <button className="primary-btn full" disabled={busy}>{busy ? "Please wait…" : mode==="login" ? "Sign in" : "Create account"}</button>
    </form>
    <button className="text-btn" onClick={()=>{setMode(mode==="login"?"signup":"login");}}>{mode==="login" ? "Need an account? Create one" : "Already have an account? Sign in"}</button>
  </div></div>
}

function ConfigHelp() {
  return <div className="screen-center"><div className="config-card"><div className="brand-mark">J</div><h2>Connect JobTrack to Supabase</h2>
    <p>Add your Supabase project URL and anon key to a <code>.env</code> file in the project root.</p>
    <pre>{`VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key`}</pre>
    <p className="muted">See <code>README.md</code> and <code>supabase/schema.sql</code> for the setup steps.</p>
  </div></div>
}

function Dashboard({apps,counts,active,interviews,onAdd}) {
  const recent = apps.slice(0,5);
  const max = Math.max(1,...STATUSES.map(s=>counts[s]));
  const sourceCounts = SOURCES.map(source=>({source,count:apps.filter(a=>a.source===source).length})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);

  return <div className="content">
    <section className="stats-grid">
      <Stat icon={<BriefcaseBusiness/>} label="Total applications" value={apps.length}/>
      <Stat icon={<Clock3/>} label="Active pipeline" value={active}/>
      <Stat icon={<CalendarDays/>} label="Interview stage" value={interviews}/>
      <Stat icon={<CheckCircle2/>} label="Accepted" value={counts.Accepted}/>
    </section>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-head"><div><h2>Application pipeline</h2><p>Current stage of your job search</p></div></div>
        <div className="pipeline">
          {STATUSES.map(s=><div className="pipeline-row" key={s}><span>{s}</span><div className="bar-track"><div className="bar-fill" style={{width:`${counts[s]/max*100}%`}}></div></div><strong>{counts[s]}</strong></div>)}
        </div>
      </section>
      <section className="panel"><div className="panel-head"><div><h2>Where you find jobs</h2><p>Your application sources</p></div></div>
        {sourceCounts.length ? <div className="source-list">{sourceCounts.map(x=><div className="source-row" key={x.source}><span>{x.source}</span><strong>{x.count}</strong></div>)}</div> : <EmptyState text="No source data yet."/>}
      </section>
    </div>
    <section className="panel"><div className="panel-head"><div><h2>Recent applications</h2><p>Your latest entries</p></div><button className="secondary-btn" onClick={onAdd}><Plus size={16}/> Add</button></div>
      {recent.length ? <div className="recent-list">{recent.map(app=><ApplicationRow key={app.id} app={app}/>)}</div> : <EmptyState text="Your job tracker is empty. Add your first application!"/>}
    </section>
  </div>
}

function Stat({icon,label,value}) { return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div> }

function ApplicationsView({apps,search,setSearch,statusFilter,setStatusFilter,sourceFilter,setSourceFilter,onEdit,onDelete,onClear}) {
  return <div className="content">
    <div className="filters panel"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search applications…"/></div>
      <div className="select-wrap"><Filter size={15}/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></div>
      <div className="select-wrap"><select value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)}><option>All</option>{SOURCES.map(s=><option key={s}>{s}</option>)}</select></div>
      {(search||statusFilter!=="All"||sourceFilter!=="All") && <button className="text-btn" onClick={onClear}>Clear filters</button>}
    </div>
    <div className="results-header"><span>{apps.length} application{apps.length!==1?"s":""}</span></div>
    {apps.length ? <div className="application-grid">{apps.map(app=><ApplicationCard key={app.id} app={app} onEdit={onEdit} onDelete={onDelete}/>)}</div> : <div className="panel empty-large"><BriefcaseBusiness size={30}/><h2>No applications found</h2><p>Try changing your filters or add a new application.</p></div>}
  </div>
}

function ApplicationCard({app,onEdit,onDelete}) {
  return <article className="application-card">
    <div className="card-top"><div className="company-avatar">{(app.company||"?").slice(0,1).toUpperCase()}</div><div className="card-title"><h3>{app.position}</h3><p><Building2 size={14}/>{app.company}</p></div><StatusBadge status={app.status}/></div>
    <div className="meta-grid">
      {app.location && <span><MapPin size={14}/>{app.location}</span>}
      {app.job_type && <span>{app.job_type}</span>}
      {app.job_classification && <span>{app.job_classification}</span>}
      {app.salary_range && <span>{app.salary_range}</span>}
    </div>
    <div className="date-line"><CalendarDays size={14}/> Applied {app.date_applied ? new Date(app.date_applied+"T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}) : "—"}</div>
    {app.notes && <p className="notes-preview">{app.notes}</p>}
    <div className="card-footer"><span className="source-pill">{app.source || "Other"}</span><div className="card-actions">
      {app.job_post_link && <a href={app.job_post_link} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Job post</a>}
      <button onClick={()=>onEdit(app)} title="Edit"><Pencil size={16}/></button><button onClick={()=>onDelete(app.id)} title="Delete"><Trash2 size={16}/></button>
    </div></div>
  </article>
}

function ApplicationRow({app}) { return <div className="recent-row"><div className="company-avatar small">{(app.company||"?").slice(0,1).toUpperCase()}</div><div className="recent-main"><strong>{app.position}</strong><span>{app.company}</span></div><StatusBadge status={app.status}/><span className="recent-date">{app.date_applied || "—"}</span></div> }

function StatusBadge({status}) { return <span className={"status "+status.toLowerCase().replaceAll(" ","-")}>{status}</span> }
function EmptyState({text}) { return <div className="empty-state"><CircleAlert size={18}/>{text}</div> }

function ApplicationModal({form,setForm,editing,onClose,onSubmit,busy}) {
  const update = (key,value)=>setForm(prev=>({...prev,[key]:value}));
  return <div className="modal-backdrop"><div className="modal">
    <div className="modal-head"><div><h2>{editing?"Edit application":"Add application"}</h2><p>Keep the details you'll want when preparing for interviews.</p></div><button className="icon-btn" onClick={onClose}><X/></button></div>
    <form onSubmit={onSubmit} className="modal-form">
      <div className="form-grid">
        <label>Position *<input value={form.position} onChange={e=>update("position",e.target.value)} placeholder="e.g. Junior Product Manager" required/></label>
        <label>Company *<input value={form.company} onChange={e=>update("company",e.target.value)} placeholder="Company name" required/></label>
        <label>Salary range<input value={form.salary_range} onChange={e=>update("salary_range",e.target.value)} placeholder="e.g. ₱30,000–₱40,000"/></label>
        <label>Location<input value={form.location} onChange={e=>update("location",e.target.value)} placeholder="e.g. BGC, Taguig / Remote"/></label>
        <label>Job type<select value={form.job_type} onChange={e=>update("job_type",e.target.value)}>{JOB_TYPES.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Job classification<select value={form.job_classification} onChange={e=>update("job_classification",e.target.value)}>{CLASSIFICATIONS.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Date posted<input type="date" value={form.date_posted} onChange={e=>update("date_posted",e.target.value)}/></label>
        <label>Date applied<input type="date" value={form.date_applied} onChange={e=>update("date_applied",e.target.value)}/></label>
        <label>Status<select value={form.status} onChange={e=>update("status",e.target.value)}>{STATUSES.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Where did you find this job?<select value={form.source} onChange={e=>update("source",e.target.value)}>{SOURCES.map(x=><option key={x}>{x}</option>)}</select></label>
      </div>
      <label>Job post link<input type="url" value={form.job_post_link} onChange={e=>update("job_post_link",e.target.value)} placeholder="https://…"/></label>
      <label>Notes / interview details<textarea value={form.notes} onChange={e=>update("notes",e.target.value)} placeholder="Interview date/time, meeting link, recruiter, follow-up date, salary discussion…"/></label>
      <label>Roles & responsibilities<textarea className="large-textarea" value={form.roles_responsibilities} onChange={e=>update("roles_responsibilities",e.target.value)} placeholder="Paste or summarize the key responsibilities from the job description…"/></label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add application"}</button></div>
    </form>
  </div></div>
}

createRoot(document.getElementById("root")).render(<App />);
