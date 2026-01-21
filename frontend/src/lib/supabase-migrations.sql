-- Phase 1: Schema Enhancement for Claude Automation
-- Run this in your Supabase SQL editor

-- Add automation columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS automation_tag TEXT CHECK (automation_tag IN ('none', 'research', 'project', 'refactor', 'infra')) DEFAULT 'none';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS automation_status TEXT CHECK (automation_status IN ('idle', 'queued', 'running', 'done', 'failed')) DEFAULT 'idle';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS automation_log JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_tag TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repo_path TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pr_link TEXT;

-- Index for bridge polling (efficient queries for queued tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_automation ON tasks (automation_tag, automation_status) WHERE automation_tag != 'none';

-- Enable realtime for tasks table (if not already enabled)
-- Note: Run this only if realtime is not already enabled
-- ALTER PUBLICATION supabase_realtime ADD TABLE tasks;

-- Row-Level Security policies (optional - use if you have auth set up)
-- CREATE POLICY "bridge_automation_update" ON tasks
--   FOR UPDATE
--   USING (auth.role() = 'service_role')
--   WITH CHECK (true);
