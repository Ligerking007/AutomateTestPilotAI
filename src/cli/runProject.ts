import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { getTargetProject, targetProjects } from '../config/projects.js';

type PipelineMode = 'full' | 'test-only';

interface RunOptions {
  projectId: string;
  mode: PipelineMode;
  headed: boolean;
  ui: boolean;
  browser?: string;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const project = getTargetProject(options.projectId);
  const baseUrl = process.env.BASE_URL || project.defaultBaseUrl;
  const env = {
    ...process.env,
    TARGET_PROJECT: project.id,
    BASE_URL: baseUrl
  };

  console.log(`Target project: ${project.name}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Local path: ${project.localPath}`);

  if (!existsSync(project.localPath)) {
    console.warn(`Warning: local project path does not exist: ${project.localPath}`);
  }

  if (options.mode === 'full') {
    await runStep('Generate AI test cases', ['tsx', 'src/ai/generateTestCases.ts'], env);
    await runStep('Generate Playwright specs', ['tsx', 'src/ai/generateSpec.ts'], env);
  }

  const playwrightArgs = ['playwright', 'test'];

  if (options.ui) {
    playwrightArgs.push('--ui');
  }

  if (options.headed) {
    playwrightArgs.push('--headed');
  }

  if (options.browser) {
    playwrightArgs.push(`--project=${options.browser}`);
  }

  let testFailed = false;

  try {
    await runStep('Run Playwright tests', playwrightArgs, env);
  } catch (error) {
    testFailed = true;
    console.error((error as Error).message);
  }

  await runStep('Analyze failures', ['tsx', 'src/ai/analyzeFailure.ts'], env);
  await runStep('Build report site', ['tsx', 'src/utils/buildReportSite.ts'], env);

  if (testFailed) {
    process.exitCode = 1;
  }
}

function parseArgs(args: string[]): RunOptions {
  const projectId = args.find((arg) => !arg.startsWith('--')) || process.env.TARGET_PROJECT || 'portfolio';
  const mode = args.includes('--test-only') ? 'test-only' : 'full';

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  return {
    projectId,
    mode,
    headed: args.includes('--headed'),
    ui: args.includes('--ui'),
    browser: readFlagValue(args, '--browser') || readFlagValue(args, '--project')
  };
}

function printHelp(): void {
  const targets = targetProjects.map((project) => `  - ${project.id}: ${project.name} (${project.defaultBaseUrl})`).join('\n');

  console.log(`
Usage:
  npm run test:project -- <target> [--test-only] [--headed] [--ui] [--browser=chromium]

Targets:
${targets}

Examples:
  npm run test:project -- portfolio
  npm run test:project -- devpilotai --test-only --browser=chromium
  BASE_URL=http://localhost:3005 npm run test:project -- portfolio
`.trim());
}

function readFlagValue(args: string[], name: string): string | undefined {
  const inline = args.find((arg) => arg.startsWith(`${name}=`));

  if (inline) {
    return inline.slice(name.length + 1);
  }

  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function runStep(label: string, command: string[], env: NodeJS.ProcessEnv): Promise<void> {
  console.log(`\n> ${label}`);
  console.log(`$ npx ${command.join(' ')}`);

  return new Promise((resolve, reject) => {
    const child = spawn('npx', command, {
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
