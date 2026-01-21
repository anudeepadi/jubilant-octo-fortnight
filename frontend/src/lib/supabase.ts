import { createClient } from '@supabase/supabase-js';

// Supabase configuration - set these in your environment or .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// External task type matching user's Supabase schema
export interface ExternalTask {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  priority?: string | null;
  status?: string | null;
  created_date?: string | null;
  due_date?: string | null;
  estimated_time?: number | null;
  resource_refs?: string[] | null;
  context?: string | null;
  next_actions?: string[] | null;
  progress_log?: string[] | null;
  filename?: string | null;
  content_hash?: string | null;
  synced_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Map external status to Vibe Kanban status
export function mapExternalStatus(
  status: string | null | undefined
): 'todo' | 'inprogress' | 'done' {
  if (!status) return 'todo';

  const normalizedStatus = status.toLowerCase().replace(/[_\s-]/g, '');

  // Handle various common status naming conventions
  if (['todo', 'new', 'open', 'pending', 'backlog'].includes(normalizedStatus)) {
    return 'todo';
  }
  if (['inprogress', 'doing', 'active', 'started', 'working'].includes(normalizedStatus)) {
    return 'inprogress';
  }
  if (['done', 'complete', 'completed', 'closed', 'finished'].includes(normalizedStatus)) {
    return 'done';
  }

  return 'todo';
}

// Map Vibe Kanban status to external status
export function mapToExternalStatus(status: string): string {
  switch (status) {
    case 'todo':
      return 'todo';
    case 'inprogress':
      return 'in_progress';
    case 'done':
      return 'done';
    default:
      return 'todo';
  }
}

export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};
