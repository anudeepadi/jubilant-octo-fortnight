import { createClient } from '@supabase/supabase-js';
import { config } from './config.js';

// Use service role key for full access
export const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Task types matching the Supabase schema
export type AutomationTag = 'none' | 'research' | 'project' | 'refactor' | 'infra';
export type AutomationStatus = 'idle' | 'queued' | 'running' | 'done' | 'failed';

export interface AutomationLogEntry {
  timestamp: string;
  type: 'started' | 'progress' | 'completed' | 'error';
  message?: string;
  output?: string;
}

export interface Task {
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
  // Automation fields
  automation_tag?: AutomationTag | null;
  automation_status?: AutomationStatus | null;
  automation_log?: AutomationLogEntry[] | null;
  project_tag?: string | null;
  repo_path?: string | null;
  pr_link?: string | null;
}

/**
 * Fetch queued tasks for automation processing
 */
export async function fetchQueuedTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .neq('automation_tag', 'none')
    .eq('automation_status', 'queued')
    .limit(1);

  if (error) {
    console.error('Error fetching queued tasks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Update task automation status
 */
export async function updateTaskStatus(
  taskId: string,
  status: AutomationStatus,
  logEntry?: AutomationLogEntry
): Promise<void> {
  // First get current log
  const { data: currentTask, error: fetchError } = await supabase
    .from('tasks')
    .select('automation_log')
    .eq('id', taskId)
    .single();

  if (fetchError) {
    console.error('Error fetching task for status update:', fetchError);
    throw fetchError;
  }

  const currentLog = currentTask?.automation_log || [];
  const newLog = logEntry ? [...currentLog, logEntry] : currentLog;

  const { error } = await supabase
    .from('tasks')
    .update({
      automation_status: status,
      automation_log: newLog,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
}

/**
 * Update task with results
 */
export async function updateTaskResults(
  taskId: string,
  updates: Partial<Task>
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task results:', error);
    throw error;
  }
}

/**
 * Add log entry to task
 */
export async function addLogEntry(
  taskId: string,
  entry: AutomationLogEntry
): Promise<void> {
  const { data: currentTask, error: fetchError } = await supabase
    .from('tasks')
    .select('automation_log')
    .eq('id', taskId)
    .single();

  if (fetchError) {
    console.error('Error fetching task for log entry:', fetchError);
    throw fetchError;
  }

  const currentLog = currentTask?.automation_log || [];

  const { error } = await supabase
    .from('tasks')
    .update({
      automation_log: [...currentLog, entry],
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  if (error) {
    console.error('Error adding log entry:', error);
    throw error;
  }
}
