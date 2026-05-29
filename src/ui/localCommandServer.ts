import { spawn } from 'node:child_process';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import { targetProjects } from '../config/projects.js';

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
    sendHtml(response, buildPageHtml());
    return;
  }

  if (request.method === 'GET' && url.pathname === '/api/commands') {
    sendJson(response, 200, {
      commands: commandDefinitions.map(({ id, label, description, allowOptions }) => ({ id, label, description, allowOptions })),
      projects: targetProjects.map(({ id, name, defaultBaseUrl }) => ({ id, name, defaultBaseUrl }))
    });
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
  }

  if (extraArgs.length > 0) {
    args.push('--', ...extraArgs);
  }

  return { command: 'npm', args, env };
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

function buildPageHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Local Command Center | Automate Test Pilot AI</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f7f9;
        --surface: #ffffff;
        --surface-alt: #eef4f2;
        --text: #101418;
        --muted: #5a6573;
        --line: #d7dde5;
        --accent: #0f766e;
        --accent-strong: #115e59;
        --danger: #b42318;
        --shadow: 0 14px 34px rgba(16, 20, 24, 0.08);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .page {
        width: min(1180px, calc(100% - 32px));
        margin: 0 auto;
        padding: 24px 0 40px;
      }
      .topbar,
      .controls,
      .run-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .mark {
        display: grid;
        width: 40px;
        height: 40px;
        place-items: center;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        color: var(--accent-strong);
        font-weight: 850;
      }
      h1 {
        margin: 28px 0 8px;
        font-size: 36px;
        line-height: 1.1;
      }
      p {
        margin: 0;
        color: var(--muted);
        line-height: 1.6;
      }
      a,
      button,
      input,
      select {
        min-height: 40px;
        border-radius: 8px;
        font: inherit;
        font-size: 14px;
      }
      a {
        display: inline-flex;
        align-items: center;
        padding: 0 14px;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--accent-strong);
        font-weight: 750;
        text-decoration: none;
      }
      button {
        cursor: pointer;
        border: 1px solid var(--accent);
        background: var(--accent);
        color: #ffffff;
        font-weight: 800;
        padding: 0 14px;
      }
      button.secondary {
        border-color: var(--line);
        background: var(--surface);
        color: var(--text);
      }
      button:disabled {
        cursor: not-allowed;
        opacity: 0.62;
      }
      .layout {
        display: grid;
        grid-template-columns: minmax(280px, 0.9fr) minmax(360px, 1.1fr);
        gap: 16px;
        margin-top: 24px;
        align-items: start;
      }
      .panel {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: var(--shadow);
        overflow: hidden;
      }
      .panel-head {
        padding: 16px;
        border-bottom: 1px solid var(--line);
        background: var(--surface-alt);
      }
      .panel-title {
        margin: 0;
        font-size: 18px;
      }
      .command-list,
      .form {
        display: grid;
        gap: 10px;
        padding: 16px;
      }
      .command-card {
        display: grid;
        gap: 8px;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
      }
      .command-card strong {
        line-height: 1.25;
      }
      .command-card span {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      label {
        display: grid;
        gap: 6px;
        color: var(--text);
        font-size: 13px;
        font-weight: 750;
      }
      input,
      select {
        width: 100%;
        border: 1px solid var(--line);
        background: var(--surface);
        color: var(--text);
        padding: 8px 10px;
      }
      input[type="checkbox"] {
        width: auto;
        min-height: auto;
        margin-right: 8px;
      }
      .two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .output {
        min-height: 420px;
        margin: 0;
        overflow: auto;
        background: #0f172a;
        color: #e2e8f0;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.55;
        padding: 16px;
        white-space: pre-wrap;
      }
      .status {
        display: inline-flex;
        align-items: center;
        min-height: 30px;
        padding: 0 10px;
        border-radius: 999px;
        background: var(--surface-alt);
        color: var(--accent-strong);
        font-size: 13px;
        font-weight: 800;
      }
      .status.failed {
        background: #fee4e2;
        color: var(--danger);
      }
      @media (max-width: 820px) {
        .layout,
        .two-col {
          grid-template-columns: 1fr;
        }
        .topbar,
        .controls,
        .run-head {
          align-items: stretch;
          flex-direction: column;
        }
        a,
        button {
          justify-content: center;
          width: 100%;
        }
        h1 {
          font-size: 30px;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="topbar">
        <div class="brand">
          <div class="mark">TP</div>
          <div>
            <strong>Automate Test Pilot AI</strong>
            <p>Local Command Center</p>
          </div>
        </div>
        <a href="http://127.0.0.1:4173" target="_blank" rel="noreferrer">Open Report UI</a>
      </header>

      <h1>Run automation commands from a local UI</h1>
      <p>This page runs only on your machine and only executes whitelisted npm scripts from this project.</p>

      <section class="layout">
        <aside class="panel">
          <div class="panel-head">
            <h2 class="panel-title">Commands</h2>
          </div>
          <div id="commandList" class="command-list"></div>
        </aside>

        <section class="panel">
          <div class="panel-head run-head">
            <h2 class="panel-title">Run Options</h2>
            <span id="status" class="status">Idle</span>
          </div>
          <div class="form">
            <label>
              Command
              <select id="command"></select>
            </label>
            <div class="two-col">
              <label>
                Project
                <select id="project"></select>
              </label>
              <label>
                Browser
                <select id="browser">
                  <option value="">All configured browsers</option>
                  <option value="chromium">Chromium</option>
                  <option value="firefox">Firefox</option>
                  <option value="webkit">WebKit</option>
                </select>
              </label>
            </div>
            <label>
              BASE_URL override
              <input id="baseUrl" placeholder="http://localhost:3002">
            </label>
            <label>
              <span><input id="testOnly" type="checkbox"> Use --test-only for project pipeline</span>
            </label>
            <div class="controls">
              <button id="runButton" type="button">Run Command</button>
              <button id="clearButton" class="secondary" type="button">Clear Output</button>
            </div>
          </div>
          <pre id="output" class="output">Select a command and click Run Command.</pre>
        </section>
      </section>
    </main>
    <script>
      const commandSelect = document.querySelector('#command');
      const projectSelect = document.querySelector('#project');
      const browserSelect = document.querySelector('#browser');
      const baseUrlInput = document.querySelector('#baseUrl');
      const testOnlyInput = document.querySelector('#testOnly');
      const runButton = document.querySelector('#runButton');
      const clearButton = document.querySelector('#clearButton');
      const output = document.querySelector('#output');
      const statusBadge = document.querySelector('#status');
      const commandList = document.querySelector('#commandList');
      let commands = [];
      let pollTimer;

      async function loadCommands() {
        const response = await fetch('/api/commands');
        const data = await response.json();
        commands = data.commands;
        commandSelect.innerHTML = commands.map((command) => '<option value="' + command.id + '">' + command.label + '</option>').join('');
        projectSelect.innerHTML = data.projects.map((project) => '<option value="' + project.id + '" data-url="' + project.defaultBaseUrl + '">' + project.name + '</option>').join('');
        commandList.innerHTML = commands.map((command) => '<article class="command-card"><strong>' + command.label + '</strong><span>' + command.description + '</span></article>').join('');
        syncProjectUrl();
      }

      function syncProjectUrl() {
        const selected = projectSelect.selectedOptions[0];
        if (selected && !baseUrlInput.value) {
          baseUrlInput.placeholder = selected.dataset.url || '';
        }
      }

      function setStatus(status) {
        statusBadge.textContent = status;
        statusBadge.classList.toggle('failed', status === 'failed');
        runButton.disabled = status === 'running';
      }

      async function runCommand() {
        setStatus('running');
        output.textContent = 'Starting command...\\n';
        const response = await fetch('/api/run', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            commandId: commandSelect.value,
            projectId: projectSelect.value,
            baseUrl: baseUrlInput.value.trim(),
            browser: browserSelect.value,
            testOnly: testOnlyInput.checked
          })
        });
        const run = await response.json();

        if (!response.ok) {
          output.textContent = run.error || 'Unable to start command.';
          setStatus('failed');
          return;
        }

        pollRun(run.id);
      }

      async function pollRun(id) {
        clearTimeout(pollTimer);
        const response = await fetch('/api/runs/' + id);
        const run = await response.json();
        output.textContent = run.output;
        output.scrollTop = output.scrollHeight;
        setStatus(run.status);

        if (run.status === 'running') {
          pollTimer = setTimeout(() => pollRun(id), 800);
        }
      }

      projectSelect.addEventListener('change', syncProjectUrl);
      runButton.addEventListener('click', runCommand);
      clearButton.addEventListener('click', () => {
        output.textContent = '';
      });

      loadCommands().catch((error) => {
        output.textContent = error.message;
        setStatus('failed');
      });
    </script>
  </body>
</html>`;
}

if (process.argv[1] && path.resolve(process.argv[1]).endsWith('localCommandServer.ts')) {
  main();
}
