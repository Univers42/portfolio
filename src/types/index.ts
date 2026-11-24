export type Category = 'All' | 'Systems & C' | 'Parsers & Engines' | 'AI & Agents' | 'Tools & Infra';

export interface ProjectMetric {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface Project {
  id: string;
  title: string;
  category: Category;
  description: string;
  fullOverview: string;
  tags: string[];
  metrics: ProjectMetric[];
  githubUrl: string;
  stars: number;
  featured?: boolean;
  proofOfWork: {
    architecturalHighlights: string[];
    technicalDecisions: string[];
    codeSnippet?: {
      filename: string;
      language: string;
      code: string;
    };
  };
}

export interface AgentRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface Agent {
  id: string;
  name: string;
  callsign: string;
  role: string;
  avatarColor: string;
  tagline: string;
  bio: string;
  specialty: string[];
  rules: AgentRule[];
  systemPrompt: string;
  modelTarget: string;
}

export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  tier: 'Free Tier (Zero Cost)' | 'Open Weights' | 'Deep Reasoning';
  latencyMs: number;
  costPer1kTokens: string;
  contextWindow: string;
  isDefault?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  avatarColor: string;
  content: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  modelUsed?: string;
  latency?: number;
  timestamp: string;
}

export interface ContextItem {
  id: string;
  title: string;
  type: 'code' | 'rule' | 'spec' | 'metric';
  content: string;
  updatedAt: string;
}
