import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TestCase } from '../types/testCase.js';
import { readJsonFile, writeJsonFile } from '../utils/fileHelper.js';

const generatedCasesFile = path.resolve('reports/test-cases.json');
const manualCasesFile = path.resolve('reports/manual-test-cases.json');

async function main(): Promise<void> {
  const generatedCases = await readOptionalCases(generatedCasesFile);
  const manualCases = await readOptionalCases(manualCasesFile);

  if (manualCases.length === 0) {
    console.log('No manual test cases found. Skipping merge.');
    return;
  }

  const merged = mergeById(generatedCases, manualCases);
  await writeJsonFile(generatedCasesFile, merged);

  console.log(`Merged ${manualCases.length} manual test case(s) into ${generatedCasesFile}. Total: ${merged.length}`);
}

async function readOptionalCases(filePath: string): Promise<TestCase[]> {
  try {
    const cases = await readJsonFile<TestCase[]>(filePath);
    return validateCases(cases, filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export function validateCases(cases: TestCase[], filePath: string): TestCase[] {
  if (!Array.isArray(cases)) {
    throw new Error(`${filePath} must contain a JSON array.`);
  }

  for (const testCase of cases) {
    if (!testCase.id || !testCase.title || !testCase.expectedResult || !Array.isArray(testCase.steps)) {
      throw new Error(`Invalid test case in ${filePath}. Required fields: id, title, steps, expectedResult.`);
    }
  }

  return cases;
}

export function mergeById(generatedCases: TestCase[], manualCases: TestCase[]): TestCase[] {
  const caseMap = new Map<string, TestCase>();

  for (const testCase of generatedCases) {
    caseMap.set(testCase.id, testCase);
  }

  for (const testCase of manualCases) {
    caseMap.set(testCase.id, {
      ...testCase,
      tags: Array.from(new Set([...testCase.tags, 'manual']))
    });
  }

  return Array.from(caseMap.values());
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
