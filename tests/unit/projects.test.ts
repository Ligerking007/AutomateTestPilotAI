import assert from 'node:assert/strict';
import test from 'node:test';
import { getTargetProject, targetProjects } from '../../src/config/projects.js';

test('targetProjects defines all supported portfolio targets', () => {
  assert.deepEqual(
    targetProjects.map((project) => project.id),
    ['devpilotai', 'codereviewpilotai', 'portfolio']
  );
});

test('getTargetProject returns a known target by id', () => {
  const project = getTargetProject('portfolio');

  assert.equal(project.name, 'JakapanKPortfolio');
  assert.equal(project.defaultBaseUrl, process.env.PORTFOLIO_URL || 'http://localhost:3002');
  assert.ok(project.tags.includes('portfolio'));
});

test('getTargetProject rejects unknown targets with valid options', () => {
  assert.throws(
    () => getTargetProject('unknown-project'),
    /Valid values: .*devpilotai.*codereviewpilotai.*portfolio/
  );
});
