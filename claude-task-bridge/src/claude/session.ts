import { spawn } from 'child_process';
import { config } from '../config.js';

export interface ClaudeOptions {
  prompt: string;
  workDir: string;
  allowedTools?: string[];
  timeout?: number;
}

export interface ClaudeResult {
  output: string;
  exitCode: number;
}

/**
 * Run Claude Code CLI with the given options
 */
export async function runClaudeCode(options: ClaudeOptions): Promise<ClaudeResult> {
  return new Promise((resolve, reject) => {
    const args = [
      '--print',
      '--dangerously-skip-permissions', // Only for trusted automation
      '-p', options.prompt,
    ];

    if (options.allowedTools && options.allowedTools.length > 0) {
      args.push('--allowedTools', options.allowedTools.join(','));
    }

    console.log(`[Claude] Starting in ${options.workDir}`);
    console.log(`[Claude] Prompt: ${options.prompt.substring(0, 100)}...`);

    const proc = spawn('claude', args, {
      cwd: options.workDir,
      shell: true,
      env: {
        ...process.env,
        // Ensure Claude uses the correct home directory
        HOME: process.env.HOME,
      },
    });

    let output = '';
    let errorOutput = '';
    const timeoutMs = options.timeout || config.claude.timeoutMs;

    // Set timeout
    const timeoutId = setTimeout(() => {
      proc.kill('SIGTERM');
      reject(new Error(`Claude Code timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    proc.stdout.on('data', (data: Buffer) => {
      const text = data.toString();
      output += text;
      console.log(`[Claude stdout] ${text}`);
    });

    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      errorOutput += text;
      console.error(`[Claude stderr] ${text}`);
    });

    proc.on('close', (code) => {
      clearTimeout(timeoutId);

      if (code === 0) {
        resolve({ output, exitCode: code });
      } else {
        // Include both stdout and stderr in case of error
        const fullOutput = output + (errorOutput ? `\n\nErrors:\n${errorOutput}` : '');
        if (code === null) {
          reject(new Error(`Claude was killed: ${fullOutput}`));
        } else {
          reject(new Error(`Claude exited with code ${code}: ${fullOutput}`));
        }
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to start Claude: ${err.message}`));
    });
  });
}

/**
 * Check if Claude Code CLI is available
 */
export async function isClaudeAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('claude', ['--version'], { shell: true });

    proc.on('close', (code) => {
      resolve(code === 0);
    });

    proc.on('error', () => {
      resolve(false);
    });
  });
}
