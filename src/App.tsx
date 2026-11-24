import { useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Bot, Check, Code2, Copy, ExternalLink, Github, Layers3, Menu, MessageSquare, Moon, Plus, Search, Send, ShieldCheck, Sparkles, SquareTerminal, Sun, X, Zap } from 'lucide-react'
import { agents as seedAgents, initialContext, initialMessages, models, projects as seedProjects } from './data/seed'
import type { Agent, Category, ChatMessage, Project } from './types'

type View = 'overview' | 'agents' | 'workspace' | 'router'

const categories: Category[] = ['All', 'Systems & C', 'Parsers & Engines', 'AI & Agents', 'Tools & Infra']
const iconFor = (id: string) => ({ polish: <Bot size={18} />, 'markdown-engine': <Code2 size={18} />, '42ctl': <SquareTerminal size={18} />, 'formula-engine': <Layers3 size={18} /> }[id] || <Code2 size={18} />)
const toneFor = (id: string) => id === 'forge' ? 'tone-forge' : id === 'lens' ? 'tone-lens' : 'tone-atlas'

function App() {
  const [view, setView] = useState<View>('overview')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark' || saved === 'light') return saved
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    try {
      localStorage.setItem('theme', theme)
    } catch {}
  }, [theme])
  const [projects] = useState(seedProjects)
  const [agents, setAgents] = useState(seedAgents)
  const [context, setContext] = useState(initialContext)
  const [messages, setMessages] = useState(initialMessages)
  const [selectedAgent, setSelectedAgent] = useState(seedAgents[0].id)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('All')
  const [draft, setDraft] = useState('')
  const [taskType, setTaskType] = useState('Code review')
  const [routeModel, setRouteModel] = useState(models[0].id)
  const [routingMode, setRoutingMode] = useState<'balanced' | 'fast' | 'free'>('balanced')
  const [contextInput, setContextInput] = useState('')
  const [toast, setToast] = useState('')
  const [isSending, setIsSending] = useState(false)

  const filteredProjects = useMemo(() => projects.filter((p) => {
    const matchCategory = category === 'All' || p.category === category
    const text = `${p.title} ${p.description} ${p.tags.join(' ')}`.toLowerCase()
    return matchCategory && text.includes(query.toLowerCase())
  }), [projects, category, query])
  const activeAgent = agents.find((agent) => agent.id === selectedAgent) || agents[0]
  const chosenModel = models.find((model) => model.id === routeModel) || models[0]

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  const updateAgent = (id: string, updater: (agent: Agent) => Agent) => setAgents((items) => items.map((agent) => agent.id === id ? updater(agent) : agent))

  const sendMessage = async () => {
    const text = draft.trim()
    if (!text || isSending) return
    const startedAt = performance.now()
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const userMessage: ChatMessage = { id: crypto.randomUUID(), senderId: 'you', senderName: 'You', senderRole: 'Workspace owner', avatarColor: 'from-zinc-500 to-zinc-700', content: text, timestamp: now }
    const conversation = [...messages.filter((message) => !message.id.startsWith('msg-')), userMessage]
      .slice(-8)
      .map((message) => ({ role: message.senderId === 'you' ? 'user' as const : 'assistant' as const, content: message.content }))
    setMessages((items) => [...items, userMessage])
    setDraft('')
    setIsSending(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: activeAgent.name,
          agentRole: activeAgent.role,
          systemPrompt: activeAgent.systemPrompt,
          rules: activeAgent.rules.filter((rule) => rule.enabled).map((rule) => rule.description),
          context: context.map((item) => `${item.title}: ${item.content}`),
          messages: conversation,
        }),
      })
      const result: unknown = await response.json()
      if (!result || typeof result !== 'object' || !('reply' in result) || typeof result.reply !== 'string') {
        const error = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'The server returned an unexpected response.'
        throw new Error(error)
      }
      const reply: ChatMessage = {
        id: crypto.randomUUID(), senderId: activeAgent.id, senderName: activeAgent.name, senderRole: activeAgent.role,
        avatarColor: activeAgent.avatarColor, content: result.reply, modelUsed: 'OpenRouter · free model router',
        latency: Math.round(performance.now() - startedAt), timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((items) => [...items, reply])
    } catch (error) {
      const reply: ChatMessage = {
        id: crypto.randomUUID(), senderId: activeAgent.id, senderName: activeAgent.name, senderRole: activeAgent.role,
        avatarColor: activeAgent.avatarColor,
        content: error instanceof Error ? error.message : 'OpenRouter request failed. Try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((items) => [...items, reply])
    } finally {
      setIsSending(false)
    }
  }

  const addContext = () => {
    const text = contextInput.trim()
    if (!text) return
    setContext((items) => [{ id: crypto.randomUUID(), title: text.length > 32 ? `${text.slice(0, 32)}…` : text, type: 'spec', content: text, updatedAt: 'Just now' }, ...items])
    setContextInput('')
    notify('Added to shared context')
  }

  const navItems: { id: View; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Work', icon: <Layers3 size={15} /> },
    { id: 'agents', label: 'Studio', icon: <Bot size={15} /> },
    { id: 'workspace', label: 'Workspace', icon: <MessageSquare size={15} /> },
    { id: 'router', label: 'Router', icon: <Zap size={15} /> },
  ]

  return <div className="portfolio-app">
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={() => { setView('overview'); setMobileMenu(false) }} aria-label="Go to portfolio home">
          <span className="brand-mark"><span>42</span></span>
          <span className="brand-copy"><strong>proof<span>/</span>work</strong><small>Univers42</small></span>
        </button>
        <button className="menu-toggle" onClick={() => setMobileMenu((open) => !open)} aria-label={mobileMenu ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileMenu}>
          {mobileMenu ? <X size={19} /> : <Menu size={19} />}
        </button>
        <nav className={`main-nav ${mobileMenu ? 'is-open' : ''}`} aria-label="Main navigation">
          {navItems.map((item) => <button key={item.id} onClick={() => { setView(item.id); setMobileMenu(false) }} className={`nav-link ${view === item.id ? 'is-active' : ''}`} aria-current={view === item.id ? 'page' : undefined}>
            <span className="nav-icon">{item.icon}</span>{item.label}
          </button>)}
        </nav>
        <div className="topbar-right">
          <button
            className="theme-toggle"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span className="theme-toggle-text">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
          <div className="topbar-note"><span className="status-dot" /> Independent work, in progress</div>
        </div>
      </div>
    </header>

    <main className="page-wrap">
      {view === 'overview' && <>
        <section className="intro-section">
          <div className="intro-copy">
            <p className="eyebrow"><span className="eyebrow-line" /> A living proof of work</p>
            <h1>Show the work.<br /><em>Not just the résumé.</em></h1>
            <p className="intro-lede">A portfolio of real projects, decisions and experiments, with a small AI studio behind the work.</p>
            <div className="intro-actions">
              <button className="button button-dark" onClick={() => document.getElementById('selected-work')?.scrollIntoView({ behavior: 'smooth' })}>Explore projects <ArrowDownRight size={15} /></button>
              <button className="button button-quiet" onClick={() => setView('workspace')}>Meet the team <ArrowUpRight size={14} /></button>
            </div>
          </div>
          <aside className="intro-aside" aria-label="Portfolio overview">
            <div className="orbit-mark"><span>U</span><i>42</i></div>
            <div className="intro-aside-copy">
              <span className="micro-label">Univers42 / portfolio</span>
              <p>Built in public.<br /><strong>Grounded in the work.</strong></p>
              <button className="text-link" onClick={() => setView('agents')}>Inside the studio <ArrowUpRight size={13} /></button>
            </div>
          </aside>
        </section>

        <section className="work-section" id="selected-work">
          <div className="section-heading">
            <div><p className="eyebrow"><span className="eyebrow-line" /> Selected work</p><h2>Projects with receipts<span className="sample-mark">Sample data</span></h2></div>
            <label className="search-field"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a project" aria-label="Search projects" /></label>
          </div>
          <div className="filter-row" aria-label="Filter projects by category">
            {categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`filter-chip ${category === item ? 'is-active' : ''}`} aria-pressed={category === item}>{item}</button>)}
          </div>
          <div className="project-list">
            {filteredProjects.map((project, index) => <button key={project.id} onClick={() => setSelectedProject(project)} className="project-row">
              <span className="project-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="project-main">
                <span className="project-title-line"><strong>{project.title}</strong>{project.featured && <span className="featured-label">Featured</span>}</span>
                <span className="project-description">{project.description}</span>
                <span className="project-tags">{project.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</span>
              </span>
              <span className="project-category">{project.category}</span>
              <span className="project-arrow"><ArrowUpRight size={17} /></span>
            </button>)}
            {filteredProjects.length === 0 && <div className="empty-state"><span>No projects found</span><p>Try another search or category.</p></div>}
          </div>
        </section>

        <section className="studio-invite">
          <div className="studio-invite-icon"><Sparkles size={17} /></div>
          <div><p className="eyebrow">Beyond the portfolio</p><h2>A small team of minds, built around the work.</h2><p className="studio-invite-copy">Explore the agent studio, shared project context and model-routing concept.</p></div>
          <button className="text-link" onClick={() => setView('agents')}>Explore the studio <ArrowUpRight size={14} /></button>
        </section>
      </>}

      {view === 'agents' && <section className="subpage-section">
        <div className="subpage-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Configure the team</p><h1>Agent <em>studio.</em></h1><p className="subpage-lede">Role definitions with explicit responsibilities, specialties and working rules.</p></div><span className="demo-note">Changes stay in this browser demo</span></div>
        <div className="agent-layout">
          <aside className="agent-list" aria-label="Choose an agent">
            {agents.map((agent) => <button key={agent.id} onClick={() => setSelectedAgent(agent.id)} className={`agent-list-item ${selectedAgent === agent.id ? 'is-active' : ''}`} aria-pressed={selectedAgent === agent.id}>
              <span className={`agent-avatar ${toneFor(agent.id)}`}>{agent.name.slice(0, 1)}</span><span className="agent-list-copy"><strong>{agent.name}</strong><small>{agent.role}</small></span><span className="agent-callsign">{agent.callsign}</span>
            </button>)}
            <button className="agent-add" onClick={() => notify('Agent creation is a demo-only interaction')}><Plus size={15} /> Add persona</button>
          </aside>
          <div className="agent-profile">
            <div className="agent-profile-head">
              <span className={`agent-avatar agent-avatar-large ${toneFor(activeAgent.id)}`}>{activeAgent.name.slice(0, 1)}</span>
              <div className="agent-profile-title"><p className="eyebrow">{activeAgent.callsign}</p><h2>{activeAgent.name}</h2><p>{activeAgent.role} <span>·</span> {activeAgent.tagline}</p></div>
            </div>
            <p className="agent-bio">{activeAgent.bio}</p>
            <div className="agent-specialties">{activeAgent.specialty.map((item) => <span key={item}>{item}</span>)}</div>
            <div className="editor-block">
              <div className="block-heading"><div><span className="micro-label">01 / Guardrails</span><h3>Working rules</h3></div><span className="micro-label">Toggle to edit</span></div>
              <div className="rules-list">{activeAgent.rules.map((rule) => <div key={rule.id} className="rule-row">
                <span className={`rule-check ${rule.enabled ? 'is-enabled' : ''}`}>{rule.enabled && <Check size={13} />}</span>
                <span className="rule-copy"><strong>{rule.label}</strong><small>{rule.description}</small></span>
                <button onClick={() => updateAgent(activeAgent.id, (agent) => ({ ...agent, rules: agent.rules.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item) }))} className={`switch ${rule.enabled ? 'is-on' : ''}`} role="switch" aria-checked={rule.enabled} aria-label={`Toggle ${rule.label}`}><span /></button>
              </div>)}</div>
            </div>
            <div className="editor-block prompt-block">
              <div className="block-heading"><div><span className="micro-label">02 / Instruction set</span><h3>System prompt</h3></div><span className="micro-label">Editable · local only</span></div>
              <textarea value={activeAgent.systemPrompt} onChange={(event) => updateAgent(activeAgent.id, (agent) => ({ ...agent, systemPrompt: event.target.value }))} rows={7} aria-label="Edit system prompt" />
            </div>
            <div className="preferred-model"><div><span className="micro-label">Preferred model</span><strong>{activeAgent.modelTarget}</strong></div><button className="text-link" onClick={() => setView('router')}>Routing concept <ArrowUpRight size={13} /></button></div>
          </div>
        </div>
      </section>}

      {view === 'workspace' && <section className="subpage-section">
        <div className="subpage-heading workspace-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Shared memory + collaboration</p><h1>Team <em>workspace.</em></h1><p className="subpage-lede">A shared room for the people and agents working on the same problem.</p></div><span className="connection-note"><i /> OpenRouter chat</span></div>
        <div className="workspace-layout">
          <section className="chat-panel" aria-label="Team conversation">
            <div className="chat-panel-head"><div><span className="micro-label">Project room</span><strong>{messages.length} messages</strong></div><label className="talk-to">Talk to <select value={selectedAgent} onChange={(event) => setSelectedAgent(event.target.value)} aria-label="Choose an agent to talk to">{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.role}</option>)}</select></label></div>
            <div className="chat-history" aria-live="polite">
              {messages.map((message) => <article key={message.id} className={`message ${message.senderId === 'you' ? 'message-user' : ''}`}>
                <span className={`message-avatar ${message.senderId === 'you' ? 'message-avatar-user' : toneFor(message.senderId)}`}>{message.senderId === 'you' ? 'SM' : message.senderName.slice(0, 1)}</span>
                <div className="message-content"><div className="message-meta"><strong>{message.senderName}</strong><span>{message.senderRole}</span>{message.id.startsWith('msg-') && <span className="sample-message-label">Example</span>}<time>{message.timestamp}</time></div><p className="message-bubble">{message.content}</p>{message.modelUsed && <span className="message-model"><Zap size={11} /> {message.id.startsWith('msg-') ? 'Example routing' : `${message.modelUsed}${message.latency ? ` · ${message.latency}ms` : ''}`}</span>}</div>
              </article>)}
              {isSending && <div className="thinking-indicator"><span />{activeAgent.name} is thinking…</div>}
            </div>
            <div className="composer-wrap">
              <div className="composer-context"><Layers3 size={13} /> Shared context attached <span>·</span>{context.length} items<button onClick={() => notify('Shared context is listed beside the conversation')}>View</button></div>
              <div className="composer"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage() } }} disabled={isSending} rows={2} placeholder={isSending ? 'Waiting for OpenRouter…' : `Message ${activeAgent.name}…`} aria-label="Write a message" /><button onClick={() => void sendMessage()} disabled={!draft.trim() || isSending} aria-label="Send message"><Send size={16} /></button></div>
              <div className="composer-hint">Enter to send <span>·</span> Shift + Enter for a new line</div>
            </div>
          </section>
          <aside className="workspace-aside">
            <section className="context-panel">
              <div className="context-heading"><div><span className="micro-label">Shared memory</span><h2>Context</h2></div><span className="context-count">{context.length}</span></div>
              <p className="context-intro">Notes every persona can use in this workspace.</p>
              <div className="context-list">{context.map((item) => <article key={item.id} className="context-item"><div className="context-item-head"><span className={`context-type type-${item.type}`} /><strong>{item.title}</strong><button onClick={() => setContext((items) => items.filter((entry) => entry.id !== item.id))} aria-label={`Remove ${item.title}`}><X size={13} /></button></div><p>{item.content}</p></article>)}</div>
              <div className="context-add"><input value={contextInput} onChange={(event) => setContextInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') addContext() }} placeholder="Add a shared note" aria-label="New shared note" /><button onClick={addContext} aria-label="Add shared note"><Plus size={15} /></button></div>
            </section>
            <section className="guardrails-panel"><div className="context-heading"><div><span className="micro-label">How we work</span><h2>Guardrails</h2></div><ShieldCheck size={16} /></div><ul>{['No external actions without approval', 'Share context across personas', 'Flag uncertainty instead of guessing'].map((rule) => <li key={rule}><Check size={13} />{rule}</li>)}</ul></section>
          </aside>
        </div>
      </section>}

      {view === 'router' && <section className="subpage-section">
        <div className="subpage-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Task-aware orchestration</p><h1>Model <em>router.</em></h1><p className="subpage-lede">A concept for matching a task with the right persona, model and trade-off.</p></div><span className="demo-note">Illustrative values</span></div>
        <div className="router-layout">
          <section className="router-controls">
            <div className="block-heading"><div><span className="micro-label">01 / Request</span><h2>Routing preferences</h2></div></div>
            <p className="router-description">Choose a task and priority to explore a possible route. These controls do not change the live chat route.</p>
            <div className="control-group"><label>Task type</label><div className="task-options">{['Code review', 'Planning', 'Implementation', 'Research'].map((task) => <button key={task} onClick={() => setTaskType(task)} className={taskType === task ? 'is-selected' : ''} aria-pressed={taskType === task}>{task}</button>)}</div></div>
            <div className="control-group"><label>Optimization goal</label><div className="goal-options">{([{ id: 'balanced', label: 'Balanced' }, { id: 'fast', label: 'Fastest' }, { id: 'free', label: 'Free tier' }] as const).map((mode) => <button key={mode.id} onClick={() => setRoutingMode(mode.id)} className={routingMode === mode.id ? 'is-selected' : ''} aria-pressed={routingMode === mode.id}>{mode.label}</button>)}</div></div>
            <div className="control-group"><label htmlFor="router-agent">Persona</label><select id="router-agent" value={selectedAgent} onChange={(event) => setSelectedAgent(event.target.value)}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.role}</option>)}</select></div>
            <div className="context-package"><Layers3 size={14} /><span><strong>Context package</strong><small>{context.length} shared notes + active persona rules</small></span></div>
          </section>
          <section className="route-preview">
            <div className="route-preview-head"><div><span className="micro-label">Preview only</span><h2>Suggested route</h2></div><span className="route-badge">Concept</span></div>
            <div className="route-card"><div className="route-card-top"><span className={`agent-avatar ${toneFor(activeAgent.id)}`}>{activeAgent.name.slice(0, 1)}</span><div><span className="micro-label">{taskType} / {activeAgent.role}</span><h3>{chosenModel.name}</h3><p>{chosenModel.provider} <span>·</span> {chosenModel.tier}</p></div></div><div className="route-metrics"><div><strong>{chosenModel.latencyMs}ms</strong><span>Sample latency</span></div><div><strong>{chosenModel.costPer1kTokens}</strong><span>Sample / 1k tokens</span></div><div><strong>{chosenModel.contextWindow}</strong><span>Sample context</span></div></div></div>
            <div className="model-list-heading"><span className="micro-label">Available demo models</span><span>Select to compare</span></div>
            <div className="model-list">{models.map((model) => <button key={model.id} onClick={() => setRouteModel(model.id)} className={`model-row ${routeModel === model.id ? 'is-selected' : ''}`} aria-pressed={routeModel === model.id}><span className="model-mark"><Zap size={14} /></span><span className="model-copy"><strong>{model.name}</strong><small>{model.provider} · {model.tier}</small></span><span className="model-value">{routingMode === 'fast' ? `${model.latencyMs}ms` : model.costPer1kTokens}<small>{model.contextWindow} context</small></span>{routeModel === model.id && <Check size={14} className="model-check" />}</button>)}</div>
            <button className="button button-dark router-run" onClick={() => notify('This is a routing concept; live chat runs separately in Team Workspace')}><Zap size={14} /> Explore this route <ArrowUpRight size={14} /></button>
            <p className="router-footnote">This preview uses sample model values. Team Workspace chat has its own OpenRouter route.</p>
          </section>
        </div>
      </section>}
    </main>

    <footer className="site-footer"><span>proof/work <span>·</span> Univers42</span><span>Project notes, decisions, evidence.</span><button onClick={() => setView('workspace')}>Open the workspace <ArrowUpRight size={13} /></button></footer>

    {selectedProject && <div className="modal-backdrop" onClick={() => setSelectedProject(null)}><section className="project-modal" role="dialog" aria-modal="true" aria-label={`${selectedProject.title} project details`} onClick={(event) => event.stopPropagation()}>
      <div className="modal-head"><div className="modal-project-mark">{iconFor(selectedProject.id)}</div><div className="modal-title"><span className="micro-label">{selectedProject.category}</span><h2>{selectedProject.title}</h2></div><button className="modal-close" onClick={() => setSelectedProject(null)} aria-label="Close project details"><X size={18} /></button></div>
      <p className="modal-overview">{selectedProject.fullOverview}</p>
      <div className="modal-columns"><div><span className="micro-label">01 / Architecture</span><div className="modal-list">{selectedProject.proofOfWork.architecturalHighlights.map((item) => <p key={item}><Check size={13} />{item}</p>)}</div></div><div><span className="micro-label">02 / Decisions</span><div className="modal-list">{selectedProject.proofOfWork.technicalDecisions.map((item) => <p key={item}><ArrowUpRight size={13} />{item}</p>)}</div></div></div>
      {selectedProject.proofOfWork.codeSnippet && <div className="code-example"><div className="code-example-head"><span>{selectedProject.proofOfWork.codeSnippet.filename}</span><span>{selectedProject.proofOfWork.codeSnippet.language} · illustrative</span></div><pre><code>{selectedProject.proofOfWork.codeSnippet.code}</code></pre></div>}
      <div className="modal-tags">{selectedProject.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="modal-actions"><a href={selectedProject.githubUrl} target="_blank" rel="noreferrer" className="button button-dark"><Github size={14} /> Open repository <ExternalLink size={12} /></a><button className="button button-quiet" onClick={() => { navigator.clipboard?.writeText(selectedProject.githubUrl); notify('Repository URL copied') }}><Copy size={13} /> Copy link</button></div>
    </section></div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </div>
}

export default App
