import { runClaudeCode } from '../claude/session.js';
import {
  generateProjectPrompt,
  generateRefactorPrompt,
  generateInfraPrompt,
} from '../claude/prompts.js';
import {
  Task,
  updateTaskStatus,
  updateTaskResults,
  addLogEntry,
} from '../supabase.js';
import { PROJECT_MAPPINGS, ProjectConfig } from '../config.js';

/**
 * Handle project/code automation tasks
 */
export async function handleProject(task: Task): Promise<void> {
  console.log(`[Project] Processing task: ${task.title}`);

  // Get project config
  const projectTag = task.project_tag;
  const repoPath = task.repo_path;

  let config: ProjectConfig | undefined;
  let workDir: string;

  if (projectTag && PROJECT_MAPPINGS[projectTag]) {
    config = PROJECT_MAPPINGS[projectTag];
    workDir = config.repoPath;
  } else if (repoPath) {
    // Use custom repo path
    workDir = repoPath;
    config = {
      repoPath: repoPath,
      testCommand: 'npm test',
      stack: 'Unknown',
    };
  } else {
    await updateTaskStatus(task.id, 'failed', {
      timestamp: new Date().toISOString(),
      type: 'error',
      message: `No project_tag or repo_path specified`,
    });
    return;
  }

  try {
    // Update status to running
    await updateTaskStatus(task.id, 'running', {
      timestamp: new Date().toISOString(),
      type: 'started',
      message: `Project task started in ${workDir}`,
    });

    // Generate appropriate prompt based on automation tag
    let prompt: string;
    switch (task.automation_tag) {
      case 'refactor':
        prompt = generateRefactorPrompt(task, config);
        break;
      case 'infra':
        prompt = generateInfraPrompt(task, config);
        break;
      case 'project':
      default:
        prompt = generateProjectPrompt(task, config);
        break;
    }

    // Run Claude Code in project mode
    const result = await runClaudeCode({
      prompt,
      workDir,
      allowedTools: ['Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep'],
    });

    // Update task with results
    await updateTaskResults(task.id, {
      automation_status: 'done',
    });

    await addLogEntry(task.id, {
      timestamp: new Date().toISOString(),
      type: 'completed',
      message: 'Project task completed successfully',
      output: result.output.substring(0, 2000) + (result.output.length > 2000 ? '...' : ''),
    });

    console.log(`[Project] Task completed: ${task.title}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Project] Task failed: ${errorMessage}`);

    await updateTaskStatus(task.id, 'failed', {
      timestamp: new Date().toISOString(),
      type: 'error',
      message: `Project task failed: ${errorMessage.substring(0, 500)}`,
    });
  }
}
