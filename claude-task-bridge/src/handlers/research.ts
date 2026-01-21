import { runClaudeCode } from '../claude/session.js';
import { generateResearchPrompt } from '../claude/prompts.js';
import {
  Task,
  updateTaskStatus,
  updateTaskResults,
  addLogEntry,
} from '../supabase.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Handle research automation tasks
 */
export async function handleResearch(task: Task): Promise<void> {
  console.log(`[Research] Processing task: ${task.title}`);

  // Create a temp directory for research output
  const researchDir = path.join(os.tmpdir(), `research-${task.id}`);
  if (!fs.existsSync(researchDir)) {
    fs.mkdirSync(researchDir, { recursive: true });
  }

  try {
    // Update status to running
    await updateTaskStatus(task.id, 'running', {
      timestamp: new Date().toISOString(),
      type: 'started',
      message: 'Research task started',
    });

    const prompt = generateResearchPrompt(task);

    // Run Claude Code in research mode
    const result = await runClaudeCode({
      prompt,
      workDir: researchDir,
      allowedTools: ['WebSearch', 'WebFetch', 'Read', 'Write'],
    });

    // Append research results to description
    const updatedDescription = (task.description || '') +
      '\n\n---\n## Research Results\n' +
      result.output;

    // Update task with results
    await updateTaskResults(task.id, {
      description: updatedDescription,
      automation_status: 'done',
    });

    await addLogEntry(task.id, {
      timestamp: new Date().toISOString(),
      type: 'completed',
      message: 'Research completed successfully',
      output: result.output.substring(0, 1000) + (result.output.length > 1000 ? '...' : ''),
    });

    console.log(`[Research] Task completed: ${task.title}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Research] Task failed: ${errorMessage}`);

    await updateTaskStatus(task.id, 'failed', {
      timestamp: new Date().toISOString(),
      type: 'error',
      message: `Research failed: ${errorMessage}`,
    });
  } finally {
    // Cleanup temp directory
    try {
      fs.rmSync(researchDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}
