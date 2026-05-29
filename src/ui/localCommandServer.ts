import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import { getAllTargetProjects, targetProjects } from '../config/projects.js';
import type { TargetProject } from '../types/testCase.js';

const host = '127.0.0.1';
const port = Number(process.env.COMMAND_CENTER_PORT || 4174);

interface CommandDefinition {
  id: string;
  label: string;
  description: string;
  script: string;
  args?: string[];
  allowOptions?: boolean;
}

interface RunRequest {
  commandId: string;
  projectId?: string;
  baseUrl?: string;
  browser?: string;
  testOnly?: boolean;
}

interface LocalTargetRequest {
  id: string;
  name: string;
  defaultBaseUrl: string;
  localPath?: string;
  description?: string;
  tags?: string[];
}

interface CommandRun {
  id: string;
  command: string;
  status: 'running' | 'passed' | 'failed';
  exitCode?: number | null;
  startedAt: string;
  finishedAt?: string;
  output: string;
}

export const commandDefinitions: CommandDefinition[] = [
  {
    id: 'check',
    label: 'Type Check',
    description: 'Run TypeScript type checking.',
    script: 'check'
  },
  {
    id: 'unit',
    label: 'Unit Tests',
    description: 'Run Node.js unit tests.',
    script: 'test:unit'
  },
  {
    id: 'generate-cases',
    label: 'Generate Test Cases',
    description: 'Generate structured test cases from requirements.',
    script: 'ai:generate-cases'
  },
  {
    id: 'merge-manual',
    label: 'Merge Manual Cases',
    description: 'Merge manual test cases into reports/test-cases.json.',
    script: 'manual:merge'
  },
  {
    id: 'generate-specs',
    label: 'Generate Specs',
    description: 'Generate Playwright specs from test-cases.json.',
    script: 'ai:generate-specs'
  },
  {
    id: 'playwright',
    label: 'Run Playwright',
    description: 'Run Playwright tests against BASE_URL.',
    script: 'test',
    allowOptions: true
  },
  {
    id: 'analyze',
    label: 'Analyze Failures',
    description: 'Create AI failure analysis from Playwright JSON results.',
    script: 'ai:analyze-failure'
  },
  {
    id: 'report',
    label: 'Build Report Site',
    description: 'Copy latest reports into public/.',
    script: 'report:site'
  },
  {
    id: 'project',
    label: 'Run Project Pipeline',
    description: 'Run the full configurable project pipeline.',
    script: 'test:project',
    allowOptions: true
  }
];

const runs = new Map<string, CommandRun>();
let activeChild: ReturnType<typeof spawn> | undefined;
const localProjectsFile = path.resolve('config/local-projects.json');

function main(): void {
  const server = createServer(async (request, response) => {
    try {
      await route(request, response);
    } catch (error) {
      sendJson(response, 500, { error: (error as Error).message });
    }
  });

  server.listen(port, host, () => {
    console.log(`Local Command Center: http://${host}:${port}`);
  });
}

async function route(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url || '/', `http://${host}:${port}`);

  if (request.method === 'GET' && url.pathname === '/') {
    sendHtml(response, await readFile(path.resolve('public/command-center.html'), 'utf8'));
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/commands') {
    const projects = getAllTargetProjects();
    sendJson(response, 200, {
      commands: commandDefinitions.map(({ id, label, description, allowOptions }) => ({ id, label, description, allowOptions })),
      projects: projects.map(({ id, name, defaultBaseUrl }) => ({ id, name, defaultBaseUrl }))
    });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/targets') {
    sendJson(response, 200, {
      defaultTargets: targetProjects,
      localTargets: await readLocalTargets()
    });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/targets') {
    const body = await readJsonBody<LocalTargetRequest>(request);
    const target = normalizeLocalTarget(body);
    const targets = await readLocalTargets();

    if (targetProjects.some((project) => project.id === target.id)) {
      sendJson(response, 409, { error: 'Default targets cannot be overwritten from the local UI.' });
      return;
    }

    await writeLocalTargets([...targets.filter((project) => project.id !== target.id), target]);
    sendJson(response, 200, { localTargets: await readLocalTargets() });
    return;
  }

  if (request.method === 'DELETE' && url.pathname.startsWith('/api/targets/')) {
    const id = decodeURIComponent(url.pathname.split('/').at(-1) || '');
    const targets = await readLocalTargets();
    await writeLocalTargets(targets.filter((project) => project.id !== id));
    sendJson(response, 200, { localTargets: await readLocalTargets() });
    return;
  }

  if (request.method === 'POST' && url.pathname === '/api/run') {
    const body = await readJsonBody<RunRequest>(request);
    const run = startCommand(body);
    sendJson(response, 202, run);
    return;
  }

  if (request.method === 'GET' && url.pathname.startsWith('/api/runs/')) {
    const id = url.pathname.split('/').at(-1) || '';
    const run = runs.get(id);

    if (!run) {
      sendJson(response, 404, { error: 'Run not found.' });
      return;
    }

    sendJson(response, 200, run);
    return;
  }

  sendJson(response, 404, { error: 'Not found.' });
}

export function buildCommand(request: RunRequest): { command: string; args: string[]; env: NodeJS.ProcessEnv } {
  const definition = commandDefinitions.find((command) => command.id === request.commandId);

  if (!definition) {
    throw new Error(`Unknown command: ${request.commandId}`);
  }

  const env = { ...process.env };
  const args = ['run', definition.script];
  const extraArgs = [...(definition.args || [])];

  if (definition.id === 'project') {
    extraArgs.push(request.projectId || 'portfolio');

    if (request.testOnly) {
      extraArgs.push('--test-only');
    }
  }

  if (definition.id === 'playwright' && request.browser) {
    extraArgs.push(`--project=${request.browser}`);
  }

  if (definition.id === 'project' && request.browser) {
    extraArgs.push(`--browser=${request.browser}`);
  }

  if (request.baseUrl) {
    env.BASE_URL = request.baseUrl;
  }

  if (request.projectId) {
    env.TARGET_PROJECT = request.projectId;
    env.BASE_URL = request.baseUrl || getAllTargetProjects().find((project) => project.id === request.projectId)?.defaultBaseUrl || env.BASE_URL;
  }

  if (extraArgs.length > 0) {
    args.push('--', ...extraArgs);
  }

  return { command: 'npm', args, env };
}

export function normalizeLocalTarget(request: LocalTargetRequest): TargetProject {
  const id = request.id.trim().toLowerCase();
  const name = request.name.trim();
  const defaultBaseUrl = request.defaultBaseUrl.trim();

  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    throw new Error('Target ID must use lowercase letters, numbers, and hyphens only.');
  }

  if (!name) {
    throw new Error('Target name is required.');
  }

  try {
    new URL(defaultBaseUrl);
  } catch {
    throw new Error('Base URL must be a valid URL.');
  }

  return {
    id,
    name,
    defaultBaseUrl,
    localPath: request.localPath?.trim() || '',
    description: request.description?.trim() || 'Local UAT target.',
    tags: normalizeTags(request.tags)
  };
}

async function readLocalTargets(): Promise<TargetProject[]> {
  try {
    const raw = await readFile(localProjectsFile, 'utf8');
    const targets = JSON.parse(raw) as LocalTargetRequest[];
    return Array.isArray(targets) ? targets.map((target) => normalizeLocalTarget(target)) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function writeLocalTargets(targets: TargetProject[]): Promise<void> {
  await mkdir(path.dirname(localProjectsFile), { recursive: true });
  await writeFile(localProjectsFile, `${JSON.stringify(targets, null, 2)}\n`, 'utf8');
}

function normalizeTags(tags?: string[]): string[] {
  const normalized = (tags || ['local', 'uat'])
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(normalized.length > 0 ? normalized : ['local', 'uat']));
}

function startCommand(request: RunRequest): CommandRun {
  if (activeChild) {
    throw new Error('Another command is already running. Wait for it to finish first.');
  }

  const { command, args, env } = buildCommand(request);
  const runId = `${Date.now()}`;
  const run: CommandRun = {
    id: runId,
    command: `${command} ${args.join(' ')}`,
    status: 'running',
    startedAt: new Date().toISOString(),
    output: `$ ${command} ${args.join(' ')}\n\n`
  };

  runs.set(runId, run);

  const child = spawn(command, args, {
    cwd: path.resolve('.'),
    env,
    shell: process.platform === 'win32'
  });

  activeChild = child;
  child.stdout.on('data', (chunk: Buffer) => appendOutput(run, chunk));
  child.stderr.on('data', (chunk: Buffer) => appendOutput(run, chunk));
  child.on('error', (error) => {
    appendOutput(run, Buffer.from(`\n${error.message}\n`));
    finishRun(run, 1);
  });
  child.on('close', (code) => finishRun(run, code));

  return run;
}

function appendOutput(run: CommandRun, chunk: Buffer): void {
  run.output += chunk.toString('utf8');
}

function finishRun(run: CommandRun, code: number | null): void {
  activeChild = undefined;
  run.exitCode = code;
  run.finishedAt = new Date().toISOString();
  run.status = code === 0 ? 'passed' : 'failed';
  run.output += `\nCommand finished with exit code ${code ?? 'unknown'}.\n`;
}

function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = '';
    request.on('data', (chunk) => {
      raw += chunk;
    });
    request.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) as T : {} as T);
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, status: number, data: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

function sendHtml(response: ServerResponse, html: string): void {
  response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  response.end(html);
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('localCommandServer.ts')) {
  main();
}
