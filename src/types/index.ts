export type SenseiState = 'idle' | 'detected' | 'interacting' | 'celebrating' | 'idea' | 'success';

export interface DetectionResult {
  hasPerson: boolean;
  score: number;
  bbox?: [number, number, number, number];
  personCount: number;
}

export interface KaizenPill {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  color: 'cyan' | 'blue' | 'emerald' | 'amber' | 'purple';
  content: string;
  actionText?: string;
  tip: string;
}

export interface QuizOption {
  text: string;
  correct?: boolean;
  response: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface CanalKaizenIdea {
  id: string;
  protocol: string;
  title: string;
  category: string;
  problem: string;
  solution: string;
  benefits: string;
  rawVoiceInput?: string;
  authorName?: string;
  department?: string;
  createdAt: string;
  status: 'Em Análise' | 'Aprovado' | 'Em Teste' | 'Implementado';
  senseiEncouragement?: string;
}
