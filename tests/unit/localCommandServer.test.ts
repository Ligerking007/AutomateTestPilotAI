import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCommand, commandDefinitions, normalizeLocalTarget } from '../../src/ui/localCommandServer.js';

test('commandDefinitions expose only whitelisted commands', () => {
  assert.deepEqual(
    commandDefinitions.map((command) => command.id),
    ['check', 'unit', 'generate-cases', 'merge-manual', 'generate-specs', 'playwright', 'analyze', 'report', 'project']
  );
});

test('buildCommand creates npm run commands with environment overrides', () => {
  const command = buildCommand({
    commandId: 'playwright',
    projectId: 'portfolio',
    baseUrl: 'http://localhost:3005',
    browser: 'chromium'
  });

  assert.equal(command.command, 'npm');
  assert.deepEqual(command.args, ['run', 'test', '--', '--project=chromium']);
  assert.equal(command.env.TARGET_PROJECT, 'portfolio');
  assert.equal(command.env.BASE_URL, 'http://localhost:3005');
});

test('buildCommand supports project pipeline options', () => {
  const command = buildCommand({
    commandId: 'project',
    projectId: 'devpilotai',
    browser: 'firefox',
    testOnly: true
  });

  assert.deepEqual(command.args, ['run', 'test:project', '--', 'devpilotai', '--test-only', '--browser=firefox']);
  assert.equal(command.env.TARGET_PROJECT, 'devpilotai');
  assert.equal(command.env.BASE_URL, process.env.DEV_PILOT_AI_URL || 'http://localhost:3000');
});

test('buildCommand rejects unknown commands', () => {
  assert.throws(
    () => buildCommand({ commandId: 'rm-rf' }),
    /Unknown command/
  );
});

test('normalizeLocalTarget validates and normalizes editable UAT targets', () => {
  const target = normalizeLocalTarget({
    id: 'My-App-UAT',
    name: 'My App UAT',
    defaultBaseUrl: 'https://uat.example.com',
    tags: ['UAT', ' smoke ', 'uat']
  });

  assert.equal(target.id, 'my-app-uat');
  assert.equal(target.name, 'My App UAT');
  assert.equal(target.defaultBaseUrl, 'https://uat.example.com');
  assert.deepEqual(target.tags, ['uat', 'smoke']);
});

test('normalizeLocalTarget rejects unsafe IDs and invalid URLs', () => {
  assert.throws(
    () => normalizeLocalTarget({ id: '../prod', name: 'Prod', defaultBaseUrl: 'https://prod.example.com' }),
    /Target ID/
  );

  assert.throws(
    () => normalizeLocalTarget({ id: 'uat', name: 'UAT', defaultBaseUrl: 'not-a-url' }),
    /valid URL/
  );
});
