import { useEffect, useMemo, useState } from 'react'
import { supabase } from './supabase'

const today = () => {
  const d = new Date()
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}
const fmtDate = d => {
  if (!d) return ''
  const t = today()
  if (d === t) return 'Today'
  if (d < t) return 'Overdue ' + new Date(d + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  return new Date(d + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

function TaskItem({ task, project, onComplete, onDelete }) {
  const [checking, setChecking] = useState(false)
  const [leaving, setLeaving] = useState(false)

  function check() {
    if (checking) return
    setChecking(true)                         // 1. ring fills + tick draws
    setTimeout(() => setLeaving(true), 450)   // 2. row fades and collapses
    setTimeout(() => onComplete(task.id), 800) // 3. remove + save
  }

  const overdue = task.due_date && task.due_date < today()
  return (
    <li className={'task' + (task._new ? ' enter' : '') + (leaving ? ' leave' : '') + (checking ? ' checked' : '')}>
      <button className={`check p${task.priority}`} aria-label="Complete task" onClick={check}>
        <svg viewBox="0 0 24 24"><path d="M7 12.5l3.2 3.2L17 9" /></svg>
      </button>
      <div className="task-body">
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          {task.due_date && <span className={'due' + (overdue ? ' overdue' : '')}>{fmtDate(task.due_date)}</span>}
          {task.labels.map(l => <span key={l} className="label">{l}</span>)}
          {project && <span className="task-proj"><i style={{ background: project.color }} />{project.name}</span>}
        </span>
      </div>
      <button className="icon-btn" aria-label="Delete task" onClick={() => onDelete(task.id)}>✕</button>
    </li>
  )
}

function QuickAdd({ mode, project, projects, onAdded }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(mode === 'today' ? today() : '')
  const [priority, setPriority] = useState('4')
  const [pid, setPid] = useState(project?.id || '')
  const [labels, setLabels] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!title.trim()) return
    const row = {
      title: title.trim(),
      due_date: date || null,
      priority: +priority,
      project_id: pid || null,
      labels: labels.split(',').map(s => s.trim().toLowerCase().replace(/^@/, '')).filter(Boolean),
    }
    const { data, error } = await supabase.from('tasks').insert(row).select().single()
    if (error) return alert(error.message)
    onAdded({ ...data, _new: true })
    setTitle(''); setLabels('')
  }

  if (!open) return <button className="add-trigger" onClick={() => setOpen(true)}><span>+</span> Add task</button>

  return (
    <form className="quick-add" onSubmit={submit}>
      <input autoFocus className="qa-title" placeholder="Task name" value={title} onChange={e => setTitle(e.target.value)} />
      <div className="qa-row">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <select value={priority} onChange={e => setPriority(e.target.value)}>
          {[1, 2, 3, 4].map(p => <option key={p} value={p}>Priority {p}</option>)}
        </select>
        {mode === 'today' && (
          <select value={pid} onChange={e => setPid(e.target.value)}>
            <option value="">No project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        <input placeholder="Labels, comma separated" value={labels} onChange={e => setLabels(e.target.value)} />
      </div>
      <div className="qa-actions">
        <button type="button" className="btn" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn primary" disabled={!title.trim()}>Add task</button>
      </div>
    </form>
  )
}

export default function TaskView({ mode, project, title, projects }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [fPri, setFPri] = useState('')
  const [fLabel, setFLabel] = useState('')
  const [fDue, setFDue] = useState('all')

  useEffect(() => {
    (async () => {
      let q = supabase.from('tasks').select('*').eq('completed', false)
      if (mode === 'today') q = q.eq('due_date', today())
      if (mode === 'project') q = q.eq('project_id', project.id)
      const { data } = await q
      setTasks(data || []); setLoading(false)
    })()
  }, [mode, project?.id])

  const allLabels = useMemo(() => [...new Set(tasks.flatMap(t => t.labels))].sort(), [tasks])

  const visible = useMemo(() => {
    const t = today()
    return tasks
      .filter(x => !fPri || x.priority === +fPri)
      .filter(x => !fLabel || x.labels.includes(fLabel))
      .filter(x => {
        if (fDue === 'today') return x.due_date === t
        if (fDue === 'overdue') return x.due_date && x.due_date < t
        if (fDue === 'upcoming') return x.due_date && x.due_date > t
        if (fDue === 'none') return !x.due_date
        return true
      })
      .sort((a, b) => a.priority - b.priority || a.created_at.localeCompare(b.created_at))
  }, [tasks, fPri, fLabel, fDue])

  const onAdded = t => {
    if (mode === 'today' && t.due_date !== today()) return
    setTasks(prev => [...prev, t])
  }
  const complete = async id => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', id)
  }
  const remove = async id => {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  const subtitle = mode === 'today'
    ? new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
    : `${tasks.length} open`

  return (
    <>
      <h2 className="page-title">{title}</h2>
      <p className="muted sub">{subtitle}</p>

      <div className="filters">
        {mode === 'project' && (
          <select value={fDue} onChange={e => setFDue(e.target.value)}>
            <option value="all">Any date</option>
            <option value="today">Today</option>
            <option value="overdue">Overdue</option>
            <option value="upcoming">Upcoming</option>
            <option value="none">No date</option>
          </select>
        )}
        <select value={fPri} onChange={e => setFPri(e.target.value)}>
          <option value="">Any priority</option>
          {[1, 2, 3, 4].map(p => <option key={p} value={p}>Priority {p}</option>)}
        </select>
        <select value={fLabel} onChange={e => setFLabel(e.target.value)}>
          <option value="">Any label</option>
          {allLabels.map(l => <option key={l} value={l}>@{l}</option>)}
        </select>
      </div>

      <ul className="tasks">
        {visible.map(t => (
          <TaskItem key={t.id} task={t} project={mode === 'today' ? projects.find(p => p.id === t.project_id) : null}
            onComplete={complete} onDelete={remove} />
        ))}
      </ul>

      {!loading && visible.length === 0 && (
        <p className="empty">{tasks.length ? 'No tasks match these filters.' : mode === 'today' ? 'Nothing due today. Add a task to get started.' : 'No tasks in this project yet.'}</p>
      )}

      <QuickAdd mode={mode} project={project} projects={projects} onAdded={onAdded} />
    </>
  )
}
