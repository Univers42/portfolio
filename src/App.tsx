import { useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, Bot, Check, ChevronDown, ChevronRight, CircleHelp, Code2, Command, Copy, ExternalLink, Github, GitBranch, Layers3, Menu, MessageSquare, MoreHorizontal, Plus, Search, Send, Settings2, ShieldCheck, Sparkles, SquareTerminal, X, Zap } from 'lucide-react'
import { agents as seedAgents, initialContext, initialMessages, models, projects as seedProjects } from './data/seed'
import type { Agent, Category, ChatMessage, Project } from './types'

type View = 'overview' | 'agents' | 'workspace' | 'router'

const categories: Category[] = ['All', 'Systems & C', 'Parsers & Engines', 'AI & Agents', 'Tools & Infra']
const gradientFor = (id: string) => ({ polish: 'from-violet-500/20 via-indigo-500/10 to-transparent', 'markdown-engine': 'from-cyan-500/20 via-blue-500/10 to-transparent', '42ctl': 'from-emerald-500/20 via-teal-500/10 to-transparent', 'formula-engine': 'from-amber-500/20 via-orange-500/10 to-transparent' }[id] || 'from-indigo-500/20 to-transparent')
const iconFor = (id: string) => ({ polish: <Bot size={22} />, 'markdown-engine': <Code2 size={22} />, '42ctl': <SquareTerminal size={22} />, 'formula-engine': <Layers3 size={22} /> }[id] || <Code2 size={22} />)

function App() {
  const [view, setView] = useState<View>('overview')
  const [mobileMenu, setMobileMenu] = useState(false)
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
    { id: 'overview', label: 'Portfolio', icon: <Layers3 size={17} /> },
    { id: 'agents', label: 'Agent studio', icon: <Bot size={17} /> },
    { id: 'workspace', label: 'Team workspace', icon: <MessageSquare size={17} /> },
    { id: 'router', label: 'Model router', icon: <Zap size={17} /> },
  ]

  return <div className="min-h-screen bg-[#08090d] text-zinc-200">
    <div className="fixed inset-0 pointer-events-none opacity-[0.16]" style={{ backgroundImage: 'radial-gradient(circle at 70% 10%, rgba(99,102,241,.18), transparent 35%), radial-gradient(circle at 10% 70%, rgba(6,182,212,.10), transparent 30%)' }} />
    <div className="relative mx-auto flex min-h-screen max-w-[1600px]">
      <aside className={`${mobileMenu ? 'fixed inset-y-0 left-0 z-40 flex w-64' : 'hidden'} lg:flex lg:sticky lg:top-0 lg:h-screen lg:w-[248px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0b0c11]/95 px-4 py-5 backdrop-blur-xl`}>
        <div className="flex items-center gap-3 px-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-indigo-300/20 bg-gradient-to-br from-indigo-500/30 to-cyan-500/20 text-indigo-200 shadow-[0_0_25px_rgba(99,102,241,.16)]"><Command size={18} /></div>
          <div><div className="text-sm font-semibold tracking-tight text-white">proof<span className="text-indigo-300">/</span>work</div><div className="mt-0.5 text-[10px] uppercase tracking-[.18em] text-zinc-500">Univers42 · demo</div></div>
          <button onClick={() => setMobileMenu(false)} className="ml-auto rounded-lg p-2 text-zinc-500 lg:hidden"><X size={17} /></button>
        </div>

        <div className="mt-9 px-2 text-[10px] font-medium uppercase tracking-[.2em] text-zinc-600">Workspace</div>
        <nav className="mt-3 space-y-1">
          {navItems.map((item) => <button key={item.id} onClick={() => { setView(item.id); setMobileMenu(false) }} className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] transition ${view === item.id ? 'border border-white/[0.08] bg-white/[0.06] text-white shadow-sm' : 'text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-300'}`}>
            <span className={view === item.id ? 'text-indigo-300' : 'text-zinc-600 group-hover:text-zinc-400'}>{item.icon}</span>{item.label}{item.id === 'workspace' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]" />}
          </button>)}
        </nav>

        <div className="mt-9 px-2 text-[10px] font-medium uppercase tracking-[.2em] text-zinc-600">Team</div>
        <div className="mt-3 space-y-1">
          {agents.map((agent) => <button key={agent.id} onClick={() => { setSelectedAgent(agent.id); setView('agents'); setMobileMenu(false) }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-white/[0.035]">
            <span className={`grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br ${agent.avatarColor} text-[10px] font-bold text-white`}>{agent.name.slice(0, 1)}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-xs text-zinc-300">{agent.name}</span><span className="block truncate text-[10px] text-zinc-600">{agent.role}</span></span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
          </button>)}
          <button onClick={() => notify('Agent creation is a demo-only interaction')} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-zinc-600 hover:bg-white/[0.035] hover:text-zinc-300"><Plus size={14} /> Add persona</button>
        </div>

        <div className="mt-auto rounded-2xl border border-white/[0.08] bg-gradient-to-br from-indigo-500/[0.09] via-white/[0.025] to-cyan-500/[0.04] p-3.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-300"><ShieldCheck size={14} className="text-emerald-400" /> Human-in-the-loop</div>
          <p className="mt-2 text-[10px] leading-relaxed text-zinc-500">Agents can plan and discuss. Repository changes stay behind your review.</p>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2.5 text-[10px] text-zinc-600"><span>Shared context</span><span className="text-zinc-400">{context.length} items</span></div>
        </div>
        <button onClick={() => notify('Settings are not connected in this demo')} className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-zinc-500 hover:bg-white/[0.04]"><Settings2 size={16} /> Settings <MoreHorizontal size={15} className="ml-auto" /></button>
      </aside>

      {mobileMenu && <button onClick={() => setMobileMenu(false)} aria-label="Close menu" className="fixed inset-0 z-30 bg-black/60 lg:hidden" />}

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-white/[0.06] bg-[#08090d]/85 px-4 backdrop-blur-xl sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenu(true)} className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.05] lg:hidden"><Menu size={18} /></button>
            <div className="hidden items-center gap-2 text-xs text-zinc-600 sm:flex"><span>Workspace</span><ChevronRight size={13} /><span className="text-zinc-300">{navItems.find((item) => item.id === view)?.label}</span></div>
            <div className="sm:hidden text-xs font-medium text-zinc-300">{navItems.find((item) => item.id === view)?.label}</div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-amber-400/15 bg-amber-400/[0.06] px-2.5 py-1 text-[10px] font-medium text-amber-300/80 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Demo data</span>
            <button onClick={() => notify('Nothing to sync: integrations are not connected')} className="flex items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-1.5 text-[11px] text-zinc-400 transition hover:border-white/[0.15] hover:text-white"><GitBranch size={13} /> <span className="hidden sm:inline">Connect GitHub</span><span className="sm:hidden">Connect</span></button>
            <button onClick={() => notify('Profile settings are not connected')} className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-zinc-600 to-zinc-800 text-[10px] font-semibold text-zinc-200">SM</button>
          </div>
        </header>

        <div className="mx-auto max-w-[1320px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
          {view === 'overview' && <>
            <section className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-[#10121a]/80 p-5 sm:p-8">
              <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-indigo-500/[0.09] blur-3xl" />
              <div className="pointer-events-none absolute bottom-[-150px] right-[30%] h-64 w-64 rounded-full bg-cyan-500/[0.07] blur-3xl" />
              <div className="relative grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/15 bg-indigo-300/[0.06] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[.14em] text-indigo-200/80"><Sparkles size={12} /> A living proof of work</div>
                  <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.12] tracking-[-.045em] text-white sm:text-[42px]">Show the work.<br /><span className="bg-gradient-to-r from-indigo-300 via-sky-300 to-teal-200 bg-clip-text text-transparent">Not just the résumé.</span></h1>
                  <p className="mt-4 max-w-xl text-[13px] leading-6 text-zinc-400 sm:text-sm">A portfolio built from real projects, decisions, and evidence, with a collaborative AI team behind the work.</p>
                  <div className="mt-6 flex flex-wrap gap-2.5">
                    <button onClick={() => document.getElementById('project-list')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-white">Explore projects <ArrowDownRight size={14} /></button>
                    <button onClick={() => setView('workspace')} className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06]"><MessageSquare size={14} /> Meet the team</button>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/[0.07] bg-[#090a0e]/70 p-4 sm:p-5">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-medium text-zinc-300"><Activity size={14} className="text-cyan-300" /> Proof of work snapshot</div><span className="text-[9px] uppercase tracking-[.16em] text-zinc-600">Illustrative</span></div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3"><div className="font-mono text-xl font-semibold text-white">04</div><div className="mt-1 text-[10px] text-zinc-600">Featured builds</div></div>
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3"><div className="font-mono text-xl font-semibold text-white">03</div><div className="mt-1 text-[10px] text-zinc-600">Active personas</div></div>
                    <div className="rounded-xl border border-white/[0.05] bg-white/[0.025] p-3"><div className="font-mono text-xl font-semibold text-emerald-300">Live</div><div className="mt-1 text-[10px] text-zinc-600">Shared context</div></div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[10px] text-zinc-600"><span className="flex -space-x-1.5">{agents.map((a) => <span key={a.id} className={`grid h-5 w-5 place-items-center rounded-full border border-[#090a0e] bg-gradient-to-br ${a.avatarColor} text-[8px] font-bold text-white`}>{a.name[0]}</span>)}</span><span>Specialists share one project memory</span><ChevronRight size={12} className="ml-auto" /></div>
                </div>
              </div>
            </section>

            <section className="mt-8" id="project-list">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div><div className="text-[10px] font-medium uppercase tracking-[.2em] text-zinc-600">Selected work</div><h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white">Projects with receipts<span className="ml-2 align-middle text-xs font-normal text-zinc-600">{filteredProjects.length}</span></h2></div>
                <div className="flex gap-2">
                  <label className="flex min-w-0 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 sm:w-56"><Search size={14} className="shrink-0 text-zinc-600" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search projects" className="w-full bg-transparent text-xs text-zinc-300 outline-none placeholder:text-zinc-600" /></label>
                  <button onClick={() => notify('GitHub integration is not connected yet')} className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.07] px-3 py-2 text-[11px] text-zinc-400 hover:bg-white/[0.04]"><Plus size={13} /> <span className="hidden sm:inline">Add project</span></button>
                </div>
              </div>
              <div className="mt-5 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[10px] transition ${category === item ? 'border border-white/[0.12] bg-white/[0.09] text-zinc-200' : 'border border-transparent text-zinc-600 hover:text-zinc-300'}`}>{item}</button>)}</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => <button key={project.id} onClick={() => setSelectedProject(project)} className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0f15] p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-white/[0.15] hover:bg-[#10131a]">
                  <div className={`pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-gradient-to-br ${gradientFor(project.id)} blur-2xl transition group-hover:scale-125`} />
                  <div className="relative flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.07] bg-black/20 text-zinc-300">{iconFor(project.id)}</span><span className="rounded-full border border-white/[0.06] bg-black/15 px-2 py-1 text-[9px] text-zinc-500">{project.category}</span></div>
                  <div className="relative mt-4 flex items-center gap-2"><h3 className="text-[15px] font-semibold tracking-tight text-zinc-100">{project.title}</h3>{project.featured && <span className="rounded-full bg-indigo-300/10 px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-indigo-200">Featured</span>}<ChevronRight size={14} className="ml-auto text-zinc-700 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" /></div>
                  <p className="relative mt-2 min-h-[40px] text-[11px] leading-5 text-zinc-500">{project.description}</p>
                  <div className="relative mt-4 flex flex-wrap gap-1.5">{project.tags.map((tag) => <span key={tag} className="rounded-md border border-white/[0.05] bg-white/[0.025] px-2 py-1 text-[9px] text-zinc-500">{tag}</span>)}</div>
                  <div className="relative mt-4 grid grid-cols-3 gap-1 border-t border-white/[0.06] pt-3">{project.metrics.map((metric) => <div key={metric.label}><div className={`font-mono text-xs ${metric.highlight ? 'text-emerald-300' : 'text-zinc-300'}`}>{metric.value}</div><div className="mt-1 text-[9px] text-zinc-600">{metric.label}</div></div>)}</div>
                </button>)}
                {filteredProjects.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-white/[0.1] py-12 text-center text-sm text-zinc-600">No projects match this search.</div>}
              </div>
            </section>
          </>}

          {view === 'agents' && <section>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="text-[10px] font-medium uppercase tracking-[.2em] text-zinc-600">Configure the team</div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Agent studio</h1><p className="mt-2 max-w-xl text-xs leading-5 text-zinc-500">Personas are role definitions with explicit responsibilities and rules. Changes here stay in this browser demo.</p></div><button onClick={() => notify('Creating a new persona is not persisted in this demo')} className="flex items-center gap-2 self-start rounded-xl border border-white/[0.08] px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.04]"><Plus size={14} /> New persona</button></div>
            <div className="mt-7 grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
              <div className="space-y-2">{agents.map((agent) => <button key={agent.id} onClick={() => setSelectedAgent(agent.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${selectedAgent === agent.id ? 'border-indigo-300/20 bg-indigo-300/[0.06]' : 'border-white/[0.06] bg-[#0d0f15] hover:border-white/[0.12]'}`}><span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${agent.avatarColor} text-lg font-semibold text-white`}>{agent.name[0]}</span><span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-medium text-zinc-200">{agent.name}<span className="font-mono text-[9px] text-zinc-600">{agent.callsign}</span></span><span className="mt-1 block text-[10px] text-zinc-500">{agent.role}</span></span><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /></button>)}</div>
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f15] p-5 sm:p-6">
                <div className="flex flex-wrap items-start gap-4 border-b border-white/[0.06] pb-5"><span className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${activeAgent.avatarColor} text-xl font-semibold text-white`}>{activeAgent.name[0]}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold text-white">{activeAgent.name}</h2><span className="rounded-full border border-white/[0.07] px-2 py-1 font-mono text-[9px] text-zinc-500">{activeAgent.callsign}</span></div><div className="mt-1 text-xs text-zinc-500">{activeAgent.role} · {activeAgent.tagline}</div></div><button onClick={() => notify('Persona settings are held locally for this demo')} className="rounded-lg p-2 text-zinc-600 hover:bg-white/[0.05] hover:text-zinc-300"><MoreHorizontal size={17} /></button></div>
                <p className="mt-5 text-xs leading-6 text-zinc-400">{activeAgent.bio}</p>
                <div className="mt-4 flex flex-wrap gap-2">{activeAgent.specialty.map((tag) => <span key={tag} className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 py-1.5 text-[10px] text-zinc-400">{tag}</span>)}</div>
                <div className="mt-6"><div className="flex items-center justify-between"><h3 className="text-xs font-medium text-zinc-300">Working rules</h3><span className="text-[9px] uppercase tracking-wider text-zinc-600">Toggle to edit</span></div><div className="mt-3 space-y-2">{activeAgent.rules.map((rule) => <div key={rule.id} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-black/10 p-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-400/[0.08] text-emerald-300"><Check size={14} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] text-zinc-300">{rule.label}</span><span className="mt-1 block text-[10px] leading-4 text-zinc-600">{rule.description}</span></span><button onClick={() => updateAgent(activeAgent.id, (agent) => ({ ...agent, rules: agent.rules.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item) }))} aria-label={`Toggle ${rule.label}`} className={`relative h-5 w-9 rounded-full transition ${rule.enabled ? 'bg-indigo-400/60' : 'bg-zinc-800'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-zinc-100 transition ${rule.enabled ? 'left-[18px]' : 'left-0.5'}`} /></button></div>)}</div></div>
                <div className="mt-6"><div className="flex items-center justify-between"><h3 className="text-xs font-medium text-zinc-300">System instructions</h3><span className="text-[9px] text-zinc-600">Editable · local only</span></div><textarea value={activeAgent.systemPrompt} onChange={(e) => updateAgent(activeAgent.id, (agent) => ({ ...agent, systemPrompt: e.target.value }))} rows={7} className="mt-3 w-full resize-y rounded-xl border border-white/[0.07] bg-[#08090d] p-3 font-mono text-[10px] leading-5 text-zinc-400 outline-none transition focus:border-indigo-400/30" /></div>
                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/[0.05] bg-black/10 p-3"><div><div className="text-[10px] text-zinc-500">Preferred model</div><div className="mt-1 text-xs text-zinc-300">{activeAgent.modelTarget}</div></div><button onClick={() => setView('router')} className="flex items-center gap-1 text-[10px] text-indigo-300">Configure routing <ChevronRight size={12} /></button></div>
              </div>
            </div>
          </section>}

          {view === 'workspace' && <section>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="text-[10px] font-medium uppercase tracking-[.2em] text-zinc-600">Shared memory + collaboration</div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Team workspace</h1><p className="mt-2 text-xs leading-5 text-zinc-500">A demo of shared context and multi-persona conversation. Messages are local and not sent to a live model.</p></div><span className="flex items-center gap-2 self-start rounded-full border border-emerald-400/15 bg-emerald-400/[0.05] px-3 py-1.5 text-[10px] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Context bus active</span></div>
            <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0d0f15]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3"><div className="flex items-center gap-2"><MessageSquare size={15} className="text-indigo-300" /><span className="text-xs font-medium text-zinc-300">Project room</span><span className="rounded-md bg-white/[0.04] px-1.5 py-1 text-[9px] text-zinc-600">{messages.length} messages</span></div><label className="flex items-center gap-2 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[10px] text-zinc-500">Talk to<select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} className="bg-transparent text-[10px] text-zinc-300 outline-none">{agents.map((a) => <option key={a.id} value={a.id} className="bg-[#10121a]">{a.name} · {a.role}</option>)}</select><ChevronDown size={11} /></label></div>
                <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">{messages.map((message) => <div key={message.id} className={`flex gap-3 ${message.senderId === 'you' ? 'flex-row-reverse' : ''}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${message.avatarColor} text-[10px] font-semibold text-white`}>{message.senderId === 'you' ? 'SM' : message.senderName[0]}</span><div className={`max-w-[85%] ${message.senderId === 'you' ? 'text-right' : ''}`}><div className={`flex flex-wrap items-baseline gap-2 ${message.senderId === 'you' ? 'justify-end' : ''}`}><span className="text-[11px] font-medium text-zinc-300">{message.senderName}</span><span className="text-[9px] text-zinc-600">{message.senderRole} · {message.timestamp}</span></div><div className={`mt-1.5 rounded-2xl border px-3.5 py-3 text-left text-[11px] leading-5 ${message.senderId === 'you' ? 'border-indigo-300/10 bg-indigo-300/[0.07] text-zinc-300' : 'border-white/[0.05] bg-black/15 text-zinc-400'}`}>{message.content}</div>{message.modelUsed && <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-zinc-700"><Zap size={10} /> {message.modelUsed}{message.latency && <span> · {message.latency}ms · demo</span>}</div>}</div></div>)}{isSending && <div className="flex items-center gap-2 pl-11 text-[10px] text-zinc-600"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-300" /> {activeAgent.name} is thinking…</div>}</div>
                <div className="border-t border-white/[0.06] p-3 sm:p-4"><div className="mb-2 flex items-center gap-2 text-[9px] text-zinc-600"><span className="flex items-center gap-1"><Layers3 size={11} /> Shared context attached</span><span>·</span><span>{context.length} items</span><button onClick={() => notify('Choose a context item in the right panel')} className="ml-auto text-indigo-300/80 hover:text-indigo-200">Manage</button></div><div className="flex items-end gap-2 rounded-xl border border-white/[0.08] bg-[#08090d] p-2"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage() } }} disabled={isSending} rows={2} placeholder={isSending ? 'Waiting for OpenRouter…' : `Message ${activeAgent.name}…`} className="max-h-28 min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2 text-xs text-zinc-300 outline-none placeholder:text-zinc-700" /><button onClick={() => void sendMessage()} disabled={!draft.trim() || isSending} className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-400 text-white transition hover:bg-indigo-300 disabled:cursor-not-allowed disabled:opacity-30"><Send size={15} /></button></div><div className="mt-2 px-1 text-[9px] text-zinc-700">Enter to send · Shift + Enter for a new line · OpenRouter free model router</div></div>
              </div>
              <aside className="space-y-4">
                <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f15] p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-medium text-zinc-300"><Layers3 size={14} className="text-cyan-300" /> Shared context</div><span className="font-mono text-[9px] text-zinc-600">{context.length}</span></div><p className="mt-2 text-[10px] leading-4 text-zinc-600">Visible to every persona in this workspace.</p><div className="mt-3 space-y-2">{context.map((item) => <div key={item.id} className="rounded-xl border border-white/[0.05] bg-black/10 p-3"><div className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${item.type === 'rule' ? 'bg-amber-300' : item.type === 'code' ? 'bg-cyan-300' : 'bg-indigo-300'}`} /><span className="text-[10px] font-medium text-zinc-400">{item.title}</span><button onClick={() => setContext((items) => items.filter((c) => c.id !== item.id))} aria-label={`Remove ${item.title}`} className="ml-auto text-zinc-700 hover:text-red-300"><X size={12} /></button></div><p className="mt-2 line-clamp-3 text-[10px] leading-4 text-zinc-600">{item.content}</p></div>)}</div><div className="mt-3 flex gap-2"><input value={contextInput} onChange={(e) => setContextInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addContext() }} placeholder="Add a shared note…" className="min-w-0 flex-1 rounded-lg border border-white/[0.06] bg-black/20 px-2.5 py-2 text-[10px] text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-indigo-400/30" /><button onClick={addContext} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.07] text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200"><Plus size={14} /></button></div></div>
                <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f15] p-4"><div className="flex items-center gap-2 text-xs font-medium text-zinc-300"><ShieldCheck size={14} className="text-emerald-300" /> Guardrails</div><div className="mt-3 space-y-2.5">{['No external actions without approval', 'Share context across personas', 'Flag uncertainty instead of guessing'].map((rule) => <div key={rule} className="flex items-start gap-2 text-[10px] leading-4 text-zinc-500"><Check size={12} className="mt-0.5 shrink-0 text-emerald-400/70" />{rule}</div>)}</div></div>
              </aside>
            </div>
          </section>}

          {view === 'router' && <section>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="text-[10px] font-medium uppercase tracking-[.2em] text-zinc-600">Task-aware orchestration</div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">Model router</h1><p className="mt-2 max-w-xl text-xs leading-5 text-zinc-500">Preview how a task could be routed by role, latency, and cost. Provider names, prices, and timings below are illustrative demo values.</p></div><span className="flex items-center gap-1.5 self-start rounded-full border border-amber-400/15 bg-amber-400/[0.05] px-3 py-1.5 text-[10px] text-amber-300"><CircleHelp size={12} /> No provider connected</span></div>
            <div className="mt-7 grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f15] p-5 sm:p-6"><div className="flex items-center gap-2 text-xs font-medium text-zinc-300"><Zap size={14} className="text-amber-300" /> Routing preferences</div><p className="mt-2 text-[10px] text-zinc-600">Pick a sample task and priority to preview the result.</p>
                <div className="mt-5"><label className="text-[10px] text-zinc-500">Task type</label><div className="mt-2 grid grid-cols-2 gap-2">{['Code review', 'Planning', 'Implementation', 'Research'].map((task) => <button key={task} onClick={() => setTaskType(task)} className={`rounded-xl border px-3 py-2.5 text-left text-[11px] transition ${taskType === task ? 'border-indigo-300/20 bg-indigo-300/[0.07] text-indigo-200' : 'border-white/[0.06] bg-black/10 text-zinc-500 hover:border-white/[0.12]'}`}>{task}</button>)}</div></div>
                <div className="mt-5"><label className="text-[10px] text-zinc-500">Optimization goal</label><div className="mt-2 grid grid-cols-3 gap-2">{([{id:'balanced', label:'Balanced', icon:<Activity size={13} />},{id:'fast', label:'Fastest', icon:<ArrowUpRight size={13} />},{id:'free', label:'Free tier', icon:<ShieldCheck size={13} />}] as const).map((mode) => <button key={mode.id} onClick={() => setRoutingMode(mode.id)} className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[10px] transition ${routingMode === mode.id ? 'border-indigo-300/20 bg-indigo-300/[0.07] text-indigo-200' : 'border-white/[0.06] text-zinc-600 hover:text-zinc-300'}`}>{mode.icon}{mode.label}</button>)}</div></div>
                <div className="mt-5"><label className="text-[10px] text-zinc-500">Persona</label><select value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.07] bg-[#08090d] px-3 py-3 text-xs text-zinc-300 outline-none">{agents.map((a) => <option className="bg-[#10121a]" value={a.id} key={a.id}>{a.name} · {a.role}</option>)}</select></div>
                <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/15 p-3.5"><div className="flex items-center gap-2 text-[10px] text-zinc-400"><Layers3 size={13} className="text-cyan-300" /> Context package</div><p className="mt-2 text-[10px] leading-4 text-zinc-600">Router preview will include {context.length} shared notes and the selected persona's active rules.</p></div>
              </div>
              <div className="rounded-2xl border border-white/[0.07] bg-[#0d0f15] p-5 sm:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-medium text-zinc-300"><Command size={14} className="text-indigo-300" /> Route preview</div><span className="rounded-full border border-white/[0.06] px-2 py-1 text-[9px] text-zinc-600">Preview only</span></div>
                <div className="mt-5 rounded-2xl border border-indigo-300/15 bg-gradient-to-br from-indigo-300/[0.06] to-cyan-300/[0.025] p-4"><div className="flex items-center justify-between"><div><div className="text-[10px] uppercase tracking-[.15em] text-zinc-600">Selected route</div><div className="mt-2 text-lg font-semibold text-white">{chosenModel.name}</div><div className="mt-1 text-[10px] text-zinc-500">{chosenModel.provider} · {activeAgent.role} · {taskType}</div></div><span className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${activeAgent.avatarColor} text-base font-semibold text-white`}>{activeAgent.name[0]}</span></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-black/20 p-2.5"><div className="font-mono text-sm text-zinc-200">{chosenModel.latencyMs}ms</div><div className="mt-1 text-[9px] text-zinc-600">sample latency</div></div><div className="rounded-xl bg-black/20 p-2.5"><div className="font-mono text-sm text-zinc-200">{chosenModel.costPer1kTokens}</div><div className="mt-1 text-[9px] text-zinc-600">sample / 1k tokens</div></div><div className="rounded-xl bg-black/20 p-2.5"><div className="font-mono text-sm text-zinc-200">{chosenModel.contextWindow}</div><div className="mt-1 text-[9px] text-zinc-600">sample context</div></div></div></div>
                <div className="mt-5 flex items-center justify-between"><h3 className="text-[11px] font-medium text-zinc-300">Available demo models</h3><span className="text-[9px] text-zinc-600">Select to compare</span></div>
                <div className="mt-2 space-y-2">{models.map((model) => <button key={model.id} onClick={() => setRouteModel(model.id)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${routeModel === model.id ? 'border-indigo-300/20 bg-indigo-300/[0.045]' : 'border-white/[0.05] bg-black/10 hover:border-white/[0.1]'}`}><span className={`grid h-8 w-8 place-items-center rounded-lg ${routeModel === model.id ? 'bg-indigo-300/10 text-indigo-200' : 'bg-white/[0.03] text-zinc-500'}`}><Zap size={14} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] text-zinc-300">{model.name}</span><span className="mt-1 block text-[9px] text-zinc-600">{model.provider} · {model.tier}</span></span><span className="text-right"><span className="block font-mono text-[10px] text-zinc-400">{routingMode === 'fast' ? model.latencyMs : model.costPer1kTokens}{routingMode === 'fast' ? 'ms' : ''}</span><span className="mt-1 block text-[9px] text-zinc-700">{model.contextWindow} context</span></span>{routeModel === model.id && <Check size={14} className="text-indigo-300" />}</button>)}</div>
                <button onClick={() => notify('Live execution needs a backend and provider configuration')} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 text-xs font-semibold text-zinc-950 transition hover:bg-white"><Zap size={14} /> Run route preview <ArrowUpRight size={13} /></button><div className="mt-2 text-center text-[9px] text-zinc-700">This button does not call a live model.</div>
              </div>
            </div>
          </section>}
          <footer className="mt-12 flex flex-col gap-2 border-t border-white/[0.05] py-5 text-[9px] text-zinc-700 sm:flex-row sm:items-center sm:justify-between"><span>proof/work · Interactive concept by Univers42</span><span className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-amber-400" /> Sample portfolio data · No live integrations connected</span></footer>
        </div>
      </main>
    </div>

    {selectedProject && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={() => setSelectedProject(null)}><div onClick={(e) => e.stopPropagation()} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[24px] border border-white/[0.1] bg-[#10121a] p-5 shadow-2xl sm:rounded-[24px] sm:p-7"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.07] bg-black/20 text-zinc-200">{iconFor(selectedProject.id)}</span><div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold text-white">{selectedProject.title}</h2><span className="text-[9px] text-zinc-600">{selectedProject.category}</span></div><p className="mt-1 text-[10px] text-zinc-600">Proof-of-work detail · sample content</p></div></div><button onClick={() => setSelectedProject(null)} className="rounded-lg p-2 text-zinc-600 hover:bg-white/[0.05] hover:text-white"><X size={17} /></button></div><p className="mt-5 text-xs leading-6 text-zinc-400">{selectedProject.fullOverview}</p><div className="mt-6 grid gap-5 md:grid-cols-2"><div><h3 className="flex items-center gap-2 text-xs font-medium text-zinc-300"><Layers3 size={13} className="text-indigo-300" /> Architectural highlights</h3><div className="mt-3 space-y-2">{selectedProject.proofOfWork.architecturalHighlights.map((item) => <div key={item} className="flex gap-2 rounded-xl border border-white/[0.05] bg-black/10 p-3 text-[10px] leading-4 text-zinc-500"><Check size={12} className="mt-0.5 shrink-0 text-emerald-400/70" />{item}</div>)}</div></div><div><h3 className="flex items-center gap-2 text-xs font-medium text-zinc-300"><ShieldCheck size={13} className="text-cyan-300" /> Technical decisions</h3><div className="mt-3 space-y-2">{selectedProject.proofOfWork.technicalDecisions.map((item) => <div key={item} className="flex gap-2 rounded-xl border border-white/[0.05] bg-black/10 p-3 text-[10px] leading-4 text-zinc-500"><ArrowUpRight size={12} className="mt-0.5 shrink-0 text-cyan-300/70" />{item}</div>)}</div></div></div>{selectedProject.proofOfWork.codeSnippet && <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07] bg-[#08090d]"><div className="flex items-center justify-between border-b border-white/[0.05] px-3 py-2"><span className="font-mono text-[10px] text-zinc-500">{selectedProject.proofOfWork.codeSnippet.filename}</span><span className="text-[9px] uppercase text-zinc-700">{selectedProject.proofOfWork.codeSnippet.language} · illustrative</span></div><pre className="overflow-x-auto p-4 font-mono text-[10px] leading-5 text-cyan-100/70"><code>{selectedProject.proofOfWork.codeSnippet.code}</code></pre></div>}<div className="mt-6 flex flex-wrap gap-2">{selectedProject.tags.map((tag) => <span key={tag} className="rounded-md border border-white/[0.06] px-2 py-1 text-[9px] text-zinc-500">{tag}</span>)}</div><div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4"><a href={selectedProject.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-[10px] text-zinc-300 hover:bg-white/[0.04]"><Github size={13} /> Open repository <ExternalLink size={11} /></a><button onClick={() => { navigator.clipboard?.writeText(selectedProject.githubUrl); notify('Repository URL copied') }} className="flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-[10px] text-zinc-400 hover:bg-white/[0.04]"><Copy size={12} /> Copy link</button></div></div></div>}
    {toast && <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-white/[0.12] bg-[#181a22] px-4 py-2.5 text-xs text-zinc-200 shadow-xl">{toast}</div>}
  </div>
}

export default App
