import 'dotenv/config';

export interface ProjectConfig {
  repoPath: string;
  testCommand: string;
  stack: string;
}

// Project tag to repository mapping
export const PROJECT_MAPPINGS: Record<string, ProjectConfig> = {
  'vibe-kanban': {
    repoPath: '/home/onebeast/Documents/Projects/vibe/vibe-kanban',
    testCommand: 'npm run check && npm run lint',
    stack: 'React + TypeScript + Rust',
  },
  'task-manager': {
    repoPath: '/home/onebeast/Documents/Projects/vibe/task-manager',
    testCommand: 'npm test',
    stack: 'Node.js + React + PostgreSQL',
  },
};

// Environment configuration
export const config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
  },
  polling: {
    intervalMs: parseInt(process.env.POLL_INTERVAL_MS || '10000', 10),
  },
  claude: {
    timeoutMs: parseInt(process.env.CLAUDE_TIMEOUT_MS || '300000', 10),
  },
};

export function validateConfig(): void {
  if (!config.supabase.url) {
    throw new Error('SUPABASE_URL is required');
  }
  if (!config.supabase.serviceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is required');
  }
}
