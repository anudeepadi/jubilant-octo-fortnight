import type { Task } from '../supabase.js';
import type { ProjectConfig } from '../config.js';

/**
 * Generate prompt for research tasks
 */
export function generateResearchPrompt(task: Task): string {
  return `
Research the following topic and provide a comprehensive summary:

**Topic:** ${task.title}
**Context:** ${task.context || 'None provided'}
**Description:** ${task.description || 'None'}

Please:
1. Search for relevant information
2. Summarize key findings
3. List useful resources/links
4. Suggest next steps

Format your response as markdown.
`.trim();
}

/**
 * Generate prompt for project/code tasks
 */
export function generateProjectPrompt(task: Task, config: ProjectConfig): string {
  return `
Implement the following task in the ${config.stack} codebase:

**Task:** ${task.title}
**Description:** ${task.description || 'No description provided'}
**Context:** ${task.context || 'None'}

Requirements:
1. Make the necessary code changes
2. Run tests: ${config.testCommand}
3. Create a git branch and commit
4. Report what was done

Do NOT push or create PRs automatically.
`.trim();
}

/**
 * Generate prompt for refactoring tasks
 */
export function generateRefactorPrompt(task: Task, config: ProjectConfig): string {
  return `
Refactor the following in the ${config.stack} codebase:

**Task:** ${task.title}
**Description:** ${task.description || 'No description provided'}
**Context:** ${task.context || 'None'}

Requirements:
1. Analyze the current implementation
2. Make refactoring changes while preserving behavior
3. Run tests to ensure nothing breaks: ${config.testCommand}
4. Create a git branch and commit with clear message
5. Report what was refactored and why

Do NOT push or create PRs automatically.
`.trim();
}

/**
 * Generate prompt for infrastructure tasks
 */
export function generateInfraPrompt(task: Task, config: ProjectConfig): string {
  return `
Handle the following infrastructure/DevOps task:

**Task:** ${task.title}
**Description:** ${task.description || 'No description provided'}
**Context:** ${task.context || 'None'}
**Stack:** ${config.stack}

Requirements:
1. Make the necessary configuration/infrastructure changes
2. Verify changes work correctly
3. Document any environment variables or setup needed
4. Create a git branch and commit
5. Report what was done

Do NOT push or create PRs automatically.
Be careful with any destructive operations.
`.trim();
}
