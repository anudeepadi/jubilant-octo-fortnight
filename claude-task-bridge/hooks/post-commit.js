#!/usr/bin/env node

/**
 * Post-commit hook for Claude Task Bridge
 * Updates Supabase task with commit information
 *
 * Usage: Set TASK_ID and SUPABASE_URL/SUPABASE_SERVICE_KEY environment variables
 */

import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';

const taskId = process.env.TASK_ID;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!taskId || !supabaseUrl || !supabaseKey) {
  console.log('Post-commit hook: Missing required environment variables');
  process.exit(0); // Exit gracefully, don't block commit
}

async function updateTaskWithCommit() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get commit info
    const commitHash = execSync('git rev-parse HEAD').toString().trim();
    const commitMessage = execSync('git log -1 --pretty=%B').toString().trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();

    // Get current task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('automation_log')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      console.error('Error fetching task:', fetchError);
      process.exit(0);
    }

    const currentLog = task?.automation_log || [];

    // Add log entry for commit
    const newLogEntry = {
      timestamp: new Date().toISOString(),
      type: 'progress',
      message: `Commit created on branch ${branch}`,
      output: `Hash: ${commitHash}\n\n${commitMessage}`,
    };

    // Update task
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        automation_log: [...currentLog, newLogEntry],
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (updateError) {
      console.error('Error updating task:', updateError);
    } else {
      console.log(`Task ${taskId} updated with commit ${commitHash.substring(0, 7)}`);
    }
  } catch (error) {
    console.error('Post-commit hook error:', error.message);
  }
}

updateTaskWithCommit();
