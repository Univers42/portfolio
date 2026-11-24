import { Agent, ChatMessage, ContextItem, LLMModel, Project } from '../types';

// Sample metrics and content are clearly presented as a working mock until linked to live data.
export const projects: Project[] = [
  {
    id: 'polish',
    title: 'Polish',
    category: 'AI & Agents',
    description: 'A hybrid AI shell orchestrating specialized agents, secure tool access, and persistent memory.',
    fullOverview: 'A terminal-native agent runtime built around explicit orchestration, deterministic boundaries, and a shared project context. The showcase is a prototype card until connected to live repository data.',
    tags: ['C', 'AI Agents', 'Orchestration', 'Security'],
    metrics: [
      { label: 'Source files', value: '1.2k+' },
      { label: 'Languages', value: 'C / TS' },
      { label: 'Last activity', value: 'Active', highlight: true },
    ],
    githubUrl: 'https://github.com/Univers42/polish',
    stars: 0,
    featured: true,
    proofOfWork: {
      architecturalHighlights: [
        'Agent loops isolated behind typed execution contracts.',
        'Tool calls pass through policy checks before reaching the shell.',
        'Context is prepared explicitly per task instead of relying on hidden global state.',
      ],
      technicalDecisions: [
        'Keep orchestration visible and testable.',
        'Fail closed when a permission or context source is unavailable.',
      ],
      codeSnippet: {
        filename: 'agent-router.ts',
        language: 'typescript',
        code: `type Role = 'lead' | 'builder' | 'reviewer';\n\nasync function dispatch(task: Task, role: Role) {\n  const context = await contextBus.collect(task);\n  const model = router.select({ role, context, task });\n\n  return model.run({\n    system: personas[role].rules,\n    context,\n    task,\n  });\n}`,
      },
    },
  },
  {
    id: 'markdown-engine',
    title: 'Markdown Engine',
    category: 'Parsers & Engines',
    description: 'A fast parser and renderer with a focus on correctness, caching, and linear-time behavior.',
    fullOverview: 'A high-performance markdown processing engine with careful treatment of parser edge cases and renderer safety. The visible proof points are representative demo data, not live repository telemetry.',
    tags: ['TypeScript', 'Parser', 'Performance', 'Testing'],
    metrics: [
      { label: 'Test cases', value: '434' },
      { label: 'Branch coverage', value: '95.23%', highlight: true },
      { label: 'Focus', value: 'Correctness' },
    ],
    githubUrl: 'https://github.com/Univers42/markdown-engine',
    stars: 0,
    proofOfWork: {
      architecturalHighlights: [
        'Parser stages are separated to keep tokenization and rendering concerns clear.',
        'Cache identity follows source content rather than process identity.',
        'Pathological inputs receive explicit regression coverage.',
      ],
      technicalDecisions: [
        'Prefer predictable complexity over a concise but fragile regular expression.',
        'Keep production hot paths lean while retaining strong validation in test harnesses.',
      ],
      codeSnippet: {
        filename: 'render.ts',
        language: 'typescript',
        code: `export function render(markdown: string) {\n  const tokens = tokenize(markdown);\n  const tree = parse(tokens);\n\n  return renderSafeHtml(tree);\n}`,
      },
    },
  },
  {
    id: '42ctl',
    title: '42ctl',
    category: 'Tools & Infra',
    description: 'A practical command-line toolkit for repeatable developer workflows.',
    fullOverview: 'A compact tooling project focused on making common development tasks easier to repeat. This example can be replaced with verified repository information once the integration is configured.',
    tags: ['Go', 'CLI', 'Automation'],
    metrics: [
      { label: 'Use case', value: 'Developer UX' },
      { label: 'Interface', value: 'CLI' },
      { label: 'Status', value: 'Prototype' },
    ],
    githubUrl: 'https://github.com/Univers42/42ctl',
    stars: 0,
    proofOfWork: {
      architecturalHighlights: [
        'Command surface organized around reusable actions.',
        'Designed for predictable, scriptable output.',
        'Small building blocks make the tool easier to extend.',
      ],
      technicalDecisions: [
        'Keep command behavior explicit.',
        'Avoid coupling user-facing commands to provider-specific details.',
      ],
    },
  },
  {
    id: 'formula-engine',
    title: 'Formula Engine',
    category: 'Parsers & Engines',
    description: 'A typed formula engine for parsing and evaluating structured expressions.',
    fullOverview: 'A project exploring expression parsing and evaluation with a typed model. Its architecture can become a live proof-of-work panel after connecting the relevant data sources.',
    tags: ['TypeScript', 'Expressions', 'Engine'],
    metrics: [
      { label: 'Problem', value: 'Parsing' },
      { label: 'Approach', value: 'Typed AST' },
      { label: 'Evidence', value: 'Sample' },
    ],
    githubUrl: 'https://github.com/Univers42/formula-engine',
    stars: 0,
    proofOfWork: {
      architecturalHighlights: [
        'Expression syntax is separated from evaluation.',
        'Typed nodes make invalid states easier to reject.',
        'Evaluation can be tested independently from parsing.',
      ],
      technicalDecisions: [
        'Represent expressions as a structured syntax tree.',
        'Keep diagnostics close to parsing boundaries.',
      ],
    },
  },
];

export const models: LLMModel[] = [
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o mini',
    provider: 'OpenAI',
    tier: 'Free Tier (Zero Cost)',
    latencyMs: 420,
    costPer1kTokens: '$0.00015',
    contextWindow: '128k',
    isDefault: true,
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    tier: 'Free Tier (Zero Cost)',
    latencyMs: 310,
    costPer1kTokens: '$0.00',
    contextWindow: '1M',
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    tier: 'Deep Reasoning',
    latencyMs: 1180,
    costPer1kTokens: '$0.00',
    contextWindow: '64k',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    tier: 'Open Weights',
    latencyMs: 680,
    costPer1kTokens: '$0.00',
    contextWindow: '128k',
  },
];

export const agents: Agent[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    callsign: 'LEAD-01',
    role: 'Technical Lead',
    avatarColor: 'from-indigo-500 to-blue-500',
    tagline: 'The systems thinker',
    bio: 'Decomposes ambiguous work into an ordered plan, protects the project architecture, and shares useful context with the team.',
    specialty: ['Architecture', 'Task planning', 'Integration'],
    modelTarget: 'gemini-2.0-flash',
    systemPrompt: `You are Atlas, the technical lead.\n\nRules:\n- Read the existing project context before proposing changes.\n- Break work into ordered, verifiable tasks.\n- Do not claim checks or outcomes that were not verified.\n- Surface risks and dependencies before implementation.\n- Share concise, structured context with other agents.`,
    rules: [
      { id: 'context-first', label: 'Context before action', description: 'Read shared project context before answering.', enabled: true },
      { id: 'ordered-work', label: 'Respect task order', description: 'Keep dependencies and milestone order explicit.', enabled: true },
      { id: 'no-unverified', label: 'No unverified claims', description: 'Mark unknowns and separate evidence from assumptions.', enabled: true },
    ],
  },
  {
    id: 'forge',
    name: 'Forge',
    callsign: 'DEV-02',
    role: 'Senior Builder',
    avatarColor: 'from-cyan-500 to-teal-500',
    tagline: 'The pragmatic builder',
    bio: 'Turns a scoped task into small, reviewable implementation steps and makes the important trade-offs visible.',
    specialty: ['Implementation', 'Refactoring', 'API design'],
    modelTarget: 'gpt-4o-mini',
    systemPrompt: `You are Forge, a senior builder.\n\nRules:\n- Follow the agreed scope and project conventions.\n- Prefer a small complete implementation over broad scaffolding.\n- Explain assumptions when requirements are missing.\n- Keep secrets out of code and sample output.\n- Hand off a concise summary and verification checklist.`,
    rules: [
      { id: 'scope-first', label: 'Stay within scope', description: 'Implement only what the task asks for.', enabled: true },
      { id: 'small-complete', label: 'Small, complete changes', description: 'Finish the core flow before adding extras.', enabled: true },
      { id: 'safe-secrets', label: 'Protect credentials', description: 'Never place API keys in browser code.', enabled: true },
    ],
  },
  {
    id: 'lens',
    name: 'Lens',
    callsign: 'QA-03',
    role: 'Quality Reviewer',
    avatarColor: 'from-amber-500 to-orange-500',
    tagline: 'The detail catcher',
    bio: 'Challenges edge cases, checks evidence, and helps the team distinguish verified results from assumptions.',
    specialty: ['Testing', 'Edge cases', 'Security review'],
    modelTarget: 'deepseek-r1',
    systemPrompt: `You are Lens, the quality reviewer.\n\nRules:\n- Review behavior, not just code shape.\n- Look for edge cases, regressions, accessibility and security issues.\n- State exactly which checks were run and what they showed.\n- Do not close issues or remove branches while human feedback is pending.\n- Report unresolved concerns plainly.`,
    rules: [
      { id: 'edge-cases', label: 'Inspect edge cases', description: 'Test boundary behavior and failure states.', enabled: true },
      { id: 'evidence', label: 'Report evidence', description: 'Name checks and observed results precisely.', enabled: true },
      { id: 'human-review', label: 'Preserve human review', description: 'Surface collaborator comments before cleanup or closure.', enabled: true },
    ],
  },
];

export const initialContext: ContextItem[] = [
  {
    id: 'ctx-1',
    title: 'Project goal',
    type: 'spec',
    content: 'Build a portfolio that proves practical work through project evidence, while also exposing an interactive team of AI personas.',
    updatedAt: 'Just now',
  },
  {
    id: 'ctx-2',
    title: 'Shared work rule',
    type: 'rule',
    content: 'Inspect collaborator comments and preserve human review before closing work, deleting branches, or merging.',
    updatedAt: 'Just now',
  },
  {
    id: 'ctx-3',
    title: 'Router strategy',
    type: 'spec',
    content: 'Route tasks by persona, context needs, latency, and cost. Treat current provider/model data as mock until connected.',
    updatedAt: 'Just now',
  },
  {
    id: 'ctx-4',
    title: 'Repo integration',
    type: 'code',
    content: 'Connect a GitHub account before showing repository-derived projects, metrics, issues, or branches.',
    updatedAt: 'Just now',
  },
];

export const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: 'atlas',
    senderName: 'Atlas',
    senderRole: 'Technical Lead',
    avatarColor: 'from-indigo-500 to-blue-500',
    content: 'Welcome to the workspace. I can help you plan a task, inspect the shared context, or decide which specialist should take the next step.',
    timestamp: '09:41',
  },
  {
    id: 'msg-2',
    senderId: 'forge',
    senderName: 'Forge',
    senderRole: 'Senior Builder',
    avatarColor: 'from-cyan-500 to-teal-500',
    content: 'The demo is running with local sample data. Provider routing and repository insights are illustrative until we connect a live backend and GitHub integration.',
    modelUsed: 'gemini-2.0-flash · mock routing',
    latency: 420,
    timestamp: '09:42',
  },
];
