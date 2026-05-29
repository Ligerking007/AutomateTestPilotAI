import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildFallbackSpec,
  buildPrompt,
  escapeForSingleQuote,
  sanitizeAiSpec
} from '../../src/ai/generateSpec.js';
import type { TestCase } from '../../src/types/testCase.js';

const sampleCase: TestCase = {
  id: 'TC-001',
  title: "Visitor can open Jakapan's portfolio",
  description: 'Smoke test for the portfolio landing page.',
  priority: 'High',
  preconditions: ['Portfolio app is running'],
  steps: ['Open the home page'],
  expectedResult: 'The page is visible',
  testType: 'UI',
  tags: ['portfolio', 'smoke']
};

test('buildPrompt includes Playwright rules and serialized test cases', () => {
  const prompt = buildPrompt([sampleCase]);

  assert.match(prompt, /getByRole/);
  assert.match(prompt, /Do not use waitForTimeout/);
  assert.match(prompt, /TC-001/);
  assert.match(prompt, /Visitor can open Jakapan's portfolio/);
});

test('sanitizeAiSpec strips markdown fences from valid TypeScript', () => {
  const spec = sanitizeAiSpec(`
\`\`\`ts
import { test, expect } from '@playwright/test';

test('home', async ({ page }) => {
  await expect(page.locator('body')).toBeVisible();
});
\`\`\`
`);

  assert.equal(spec.startsWith('import { test, expect }'), true);
  assert.equal(spec.includes('```'), false);
});

test('sanitizeAiSpec rejects missing assertions and hard-coded sleeps', () => {
  assert.throws(
    () => sanitizeAiSpec("import { test } from '@playwright/test';\n"),
    /missing required Playwright imports or assertions/
  );

  assert.throws(
    () => sanitizeAiSpec("import { test, expect } from '@playwright/test';\nawait page.waitForTimeout(1000);\nexpect(true).toBe(true);"),
    /waitForTimeout/
  );
});

test('buildFallbackSpec creates runnable smoke specs with escaped titles and tags', () => {
  const spec = buildFallbackSpec([sampleCase]);

  assert.match(spec, /test.describe/);
  assert.match(spec, /TC-001 Visitor can open Jakapan\\'s portfolio @portfolio @smoke/);
  assert.equal(spec.includes("await page.goto('/');"), true);
  assert.equal(spec.includes("await expect(page.locator('body')).toBeVisible();"), true);
});

test('escapeForSingleQuote escapes backslashes and single quotes', () => {
  assert.equal(escapeForSingleQuote("C:\\temp\\Jakapan's"), "C:\\\\temp\\\\Jakapan\\'s");
});
