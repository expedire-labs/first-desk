import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import TaskView from './TaskView'
import Projects from './Projects'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [tab, setTab] = useState('dashboard')
  const [projects, setProjects] = useState([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const loadProjects = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at')
    setProjects(data || [])
  }, [])

  useEffect(() => { if (session) loadProjects() }, [session, loadProjects])

  if (session === undefined) return null
  if (!session) return <Auth />

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
        <button className="nav-item signout" onClick={() => supabase.auth.signOut()}>Sign out</button>
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
