# Claude Task Bridge Hooks

These hooks integrate with Claude Code to report task progress back to Supabase.

## Setup

### 1. Configure hooks.json in your project

Create or update `.claude/hooks.json` in your project directory:

```json
{
  "postCommit": {
    "command": "node /path/to/claude-task-bridge/hooks/post-commit.js",
    "env": {
      "SUPABASE_URL": "${SUPABASE_URL}",
      "SUPABASE_SERVICE_KEY": "${SUPABASE_SERVICE_KEY}",
      "TASK_ID": "${TASK_ID}"
    }
  }
}
```

### 2. Environment Variables

The hooks require the following environment variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key (not anon key)
- `TASK_ID` - The ID of the task being worked on (set by bridge service)

### 3. Available Hooks

#### post-commit.js

Updates the task's automation log with commit information after each commit:
- Commit hash
- Commit message
- Branch name
- Timestamp

## Usage with Bridge Service

When the bridge service runs Claude Code for a task, it sets the `TASK_ID` environment variable. The hooks then use this to update the correct task in Supabase.
