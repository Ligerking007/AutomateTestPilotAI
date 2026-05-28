import path from 'node:path';
import { runAiPrompt } from './openAiClient.js';
import type { TestCase } from '../types/testCase.js';
import { readJsonFile, writeTextFile } from '../utils/fileHelper.js';

const inputFile = path.resolve('reports/test-cases.json');
const outputFile = path.resolve('tests/generated/ai.generated.spec.ts');

async function main(): Promise<void> {
  const testCases = await readJsonFile<TestCase[]>(inputFile);

  // Ask AI for the first draft, then validate the output before writing an executable spec.
  const aiOutput = await runAiPrompt({
    system: 'You are a senior Playwright automation engineer. Return TypeScript code only, no markdown fences.',
    user: buildPrompt(testCases),
    temperature: 0.1
  });

  const spec = aiOutput ? sanitizeAiSpec(aiOutput) : buildFallbackSpec(testCases);

  await writeTextFile(outputFile, spec);
  console.log(`Generated ${testCases.length} Playwright test(s) at ${outputFile}`);
}

function buildPrompt(testCases: TestCase[]): string {
  return `
Generate a complete Playwright TypeScript spec file from these test cases.

Rules:
- Import { test, expect } from '@playwright/test'
- Use accessible locators such as getByRole, getByLabel, and getByTestId where practical
- Use expect assertions
- Do not use waitForTimeout or hard-coded sleeps
- Use page.goto('/') unless a test case clearly requires another route
- Keep tests stable for a portfolio demo
- Use reusable Page Object Model imports only if they are helpful:
  - import { LoginPage } from '../../src/pages/LoginPage.js'
  - import { DashboardPage } from '../../src/pages/DashboardPage.js'
- Output only valid TypeScript code

Test cases:
${JSON.stringify(testCases, null, 2)}
`.trim();
}

function sanitizeAiSpec(raw: string): string {
  // Strip markdown fences because LLMs may still return them even when the prompt says code only.
  const cleaned = raw
    .replace(/^```(?:ts|typescript)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  if (!cleaned.includes("from '@playwright/test'") || !cleaned.includes('expect(')) {
    throw new Error('AI-generated spec is missing required Playwright imports or assertions.');
  }

  if (cleaned.includes('waitForTimeout')) {
    throw new Error('AI-generated spec used waitForTimeout, which is not allowed.');
  }

  return `${cleaned}\n`;
}

function buildFallbackSpec(testCases: TestCase[]): string {
  console.log('No AI API key found. Using deterministic Playwright spec generator for local demo.');
  // The fallback keeps the portfolio demo runnable without requiring an OpenAI key.
  const tests = testCases.map(buildTestBlock).join('\n\n');

  return `import { test, expect } from '@playwright/test';

test.describe('AI generated portfolio checks fallback', () => {
${tests}
});
`;
}

function buildTestBlock(testCase: TestCase): string {
  const title = escapeForSingleQuote(`${testCase.id} ${testCase.title}`);
  const tags = testCase.tags.map((tag) => `@${tag}`).join(' ');

  return `  test('${title} ${tags}', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('body')).not.toBeEmpty();

    const primaryLandmark = page.getByRole('main').or(page.locator('body'));
    await expect(primaryLandmark.first()).toBeVisible();
  });`;
}

function escapeForSingleQuote(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
