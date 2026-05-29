import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeById, validateCases } from '../../src/manual/mergeManualTestCases.js';
import type { TestCase } from '../../src/types/testCase.js';

function createCase(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: 'TC-001',
    title: 'Generated smoke case',
    description: 'Generated description',
    priority: 'Medium',
    preconditions: [],
    steps: ['Open the page'],
    expectedResult: 'Page is visible',
    testType: 'UI',
    tags: ['generated'],
    ...overrides
  };
}

test('mergeById keeps generated cases and appends new manual cases', () => {
  const generated = [createCase({ id: 'TC-001' })];
  const manual = [createCase({ id: 'MANUAL-001', title: 'Manual regression', tags: ['portfolio'] })];

  const merged = mergeById(generated, manual);

  assert.equal(merged.length, 2);
  assert.equal(merged[0].id, 'TC-001');
  assert.deepEqual(merged[1].tags, ['portfolio', 'manual']);
});

test('mergeById lets manual cases replace matching generated IDs', () => {
  const generated = [createCase({ id: 'TC-001', title: 'Old generated title' })];
  const manual = [createCase({ id: 'TC-001', title: 'Manual override', tags: ['manual', 'smoke'] })];

  const merged = mergeById(generated, manual);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].title, 'Manual override');
  assert.deepEqual(merged[0].tags, ['manual', 'smoke']);
});

test('validateCases accepts complete test cases', () => {
  const cases = [createCase()];

  assert.equal(validateCases(cases, 'cases.json'), cases);
});

test('validateCases rejects invalid payloads', () => {
  assert.throws(
    () => validateCases({} as TestCase[], 'cases.json'),
    /must contain a JSON array/
  );

  assert.throws(
    () => validateCases([createCase({ steps: [] }), { id: 'bad' } as TestCase], 'cases.json'),
    /Invalid test case/
  );
});
