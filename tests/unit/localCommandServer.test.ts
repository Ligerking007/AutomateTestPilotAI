import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCommand, commandDefinitions } from '../../src/ui/localCommandServer.js';

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
});

test('buildCommand rejects unknown commands', () => {
  assert.throws(
    () => buildCommand({ commandId: 'rm-rf' }),
    /Unknown command/
  );
});
