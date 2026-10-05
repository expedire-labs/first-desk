import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import TaskView from './TaskView'
import Projects from './Projects'

export default function App() {
  const [tab, setTab] = useState('dashboard')
  const [projects, setProjects] = useState([])

  const loadProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at')
    setProjects(data || [])
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  const tabs = [['dashboard', 'Dashboard'], ['projects', 'Projects']]

  return (
    <div className="shell">
      <nav className="nav">
        <div className="brand">First Desk</div>
        {tabs.map(([id, label]) => (
          <button key={id} className={'nav-item' + (tab === id ? ' active' : '')} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      <main className="main">
        {tab === 'dashboard' ? (
          <TaskView key="today" mode="today" title="Today" projects={projects} />
        ) : (
          <Projects projects={projects} reload={loadProjects} />
        )}
      </main>
    </div>
  )
}
