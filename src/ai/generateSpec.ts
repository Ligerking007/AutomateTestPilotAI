import path from 'node:path';
import type { TestCase } from '../types/testCase.js';
import { readJsonFile, writeTextFile } from '../utils/fileHelper.js';

const inputFile = path.resolve('reports/test-cases.json');
const outputFile = path.resolve('tests/generated/ai.generated.spec.ts');

async function main(): Promise<void> {
  const testCases = await readJsonFile<TestCase[]>(inputFile);
  const spec = buildSpec(testCases);

  await writeTextFile(outputFile, spec);
  console.log(`Generated ${testCases.length} Playwright test(s) at ${outputFile}`);
}

function buildSpec(testCases: TestCase[]): string {
  const tests = testCases.map(buildTestBlock).join('\n\n');

  return `import { test, expect } from '@playwright/test';

test.describe('AI generated portfolio checks', () => {
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
