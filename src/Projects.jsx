import { useState } from 'react'
import { supabase } from './supabase'
import TaskView from './TaskView'

const COLORS = ['#324A5E', '#c4572f', '#4a8f6a', '#8a5fb5', '#d19a1f', '#3f7fbf', '#b5476e']

export default function Projects({ projects, reload }) {
  const [open, setOpen] = useState(null)
  const [name, setName] = useState('')

  async function add(e) {
    e.preventDefault()
    if (!name.trim()) return
    await supabase.from('projects').insert({ name: name.trim(), color: COLORS[projects.length % COLORS.length] })
    setName(''); reload()
  }

  async function remove(p) {
    if (!confirm(`Delete "${p.name}" and all its tasks?`)) return
    await supabase.from('projects').delete().eq('id', p.id)
    reload()
  }

  if (open) {
    return (
      <>
        <button className="link back" onClick={() => setOpen(null)}>‹ All projects</button>
        <TaskView key={open.id} mode="project" project={open} title={open.name} projects={projects} />
      </>
    )
  }

  return (
    <>
      <h2 className="page-title">Projects</h2>
      <form className="proj-add" onSubmit={add}>
        <input placeholder="New project name" value={name} onChange={e => setName(e.target.value)} />
        <button className="btn primary">Add project</button>
      </form>
      {projects.length === 0 && <p className="empty">No projects yet. Name one above to group related tasks.</p>}
      <ul className="proj-list">
        {projects.map(p => (
          <li key={p.id} className="proj" onClick={() => setOpen(p)}>
            <span className="dot" style={{ background: p.color }} />
            <span className="proj-name">{p.name}</span>
            <button className="icon-btn" aria-label={`Delete ${p.name}`} onClick={e => { e.stopPropagation(); remove(p) }}>✕</button>
          </li>
        ))}
      </ul>
    </>
  )
}
