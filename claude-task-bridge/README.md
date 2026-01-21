# Claude Task Bridge

A bridge service that connects Supabase tasks with Claude Code for automated task processing.

## Features

- Polls Supabase for queued automation tasks
- Executes Claude Code CLI for different task types:
  - **Research**: Web search and information gathering
  - **Project**: Code implementation tasks
  - **Refactor**: Code refactoring tasks
  - **Infrastructure**: DevOps/infrastructure tasks
- Updates task status and logs in real-time
- Optional post-commit hooks for progress tracking

## Prerequisites

- Node.js 18+
- Claude Code CLI installed and authenticated
- Supabase project with tasks table

## Installation

```bash
cd claude-task-bridge
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Edit `.env` with your credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
POLL_INTERVAL_MS=10000
CLAUDE_TIMEOUT_MS=300000
```

3. Update project mappings in `src/config.ts`:

```typescript
export const PROJECT_MAPPINGS: Record<string, ProjectConfig> = {
  'your-project': {
    repoPath: '/path/to/your/project',
    testCommand: 'npm test',
    stack: 'Your Tech Stack',
  },
};
```

## Supabase Schema

Run the migration in `frontend/src/lib/supabase-migrations.sql` to add the required columns:

```sql
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS automation_tag TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS automation_status TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS automation_log JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_tag TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS repo_path TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS pr_link TEXT;
```

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## Workflow

1. Create a task in the External Tasks UI
2. Set `automation_tag` (research, project, refactor, or infra)
3. Set `project_tag` or `repo_path` for code tasks
4. Click "Run Automation" → status becomes `queued`
5. Bridge picks up the task → status becomes `running`
6. Claude Code executes the task
7. Results appear in task detail panel → status becomes `done`

## Hooks Integration

See `hooks/README.md` for setting up post-commit hooks that report progress back to Supabase.

## Architecture

```
claude-task-bridge/
├── src/
│   ├── index.ts           # Main entry, polling loop
│   ├── config.ts          # Configuration and project mappings
│   ├── supabase.ts        # Supabase client and queries
│   ├── handlers/
│   │   ├── research.ts    # Research task handler
│   │   └── project.ts     # Project/refactor/infra handler
│   └── claude/
│       ├── session.ts     # Claude Code CLI wrapper
│       └── prompts.ts     # Prompt templates
└── hooks/
    └── post-commit.js     # Post-commit hook script
```

## Security Notes

- Uses `--dangerously-skip-permissions` flag for Claude Code (only use for trusted automation)
- Store `SUPABASE_SERVICE_KEY` securely (never commit to git)
- The bridge service should run on a trusted machine
