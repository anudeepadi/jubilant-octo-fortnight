import { config, validateConfig } from './config.js';
import { fetchQueuedTasks, Task } from './supabase.js';
import { isClaudeAvailable } from './claude/session.js';
import { handleResearch } from './handlers/research.js';
import { handleProject } from './handlers/project.js';

let isProcessing = false;

/**
 * Process a single task based on its automation tag
 */
async function processTask(task: Task): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing task: ${task.title}`);
  console.log(`  ID: ${task.id}`);
  console.log(`  Tag: ${task.automation_tag}`);
  console.log(`  Project: ${task.project_tag || 'N/A'}`);
  console.log(`${'='.repeat(60)}\n`);

  switch (task.automation_tag) {
    case 'research':
      await handleResearch(task);
      break;

    case 'project':
    case 'refactor':
    case 'infra':
      await handleProject(task);
      break;

    default:
      console.warn(`Unknown automation tag: ${task.automation_tag}`);
  }
}

/**
 * Poll for queued tasks and process them
 */
async function pollAndProcess(): Promise<void> {
  if (isProcessing) {
    console.log('[Poll] Already processing a task, skipping this poll');
    return;
  }

  try {
    const tasks = await fetchQueuedTasks();

    if (tasks.length === 0) {
      // No tasks to process
      return;
    }

    isProcessing = true;
    const task = tasks[0];

    try {
      await processTask(task);
    } catch (error) {
      console.error(`Error processing task ${task.id}:`, error);
    }
  } catch (error) {
    console.error('Error fetching queued tasks:', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log('Claude Task Bridge v1.0.0');
  console.log('========================\n');

  // Validate configuration
  try {
    validateConfig();
    console.log('Configuration validated');
  } catch (error) {
    console.error('Configuration error:', error);
    process.exit(1);
  }

  // Check if Claude CLI is available
  const claudeAvailable = await isClaudeAvailable();
  if (!claudeAvailable) {
    console.error('ERROR: Claude CLI is not available. Please install it first.');
    console.error('Visit: https://claude.ai/docs/claude-cli');
    process.exit(1);
  }
  console.log('Claude CLI is available');

  // Start polling loop
  console.log(`\nStarting poll loop (interval: ${config.polling.intervalMs}ms)`);
  console.log('Waiting for queued tasks...\n');

  // Initial poll
  await pollAndProcess();

  // Set up polling interval
  setInterval(pollAndProcess, config.polling.intervalMs);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, shutting down gracefully...');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
