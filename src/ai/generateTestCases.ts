import path from 'node:path';
import { runAiPrompt } from './openAiClient.js';
import { getTargetProject } from '../config/projects.js';
import type { RequirementBundle, TestCase } from '../types/testCase.js';
import { listMarkdownFiles, readTextFile, writeJsonFile } from '../utils/fileHelper.js';

const requirementsDir = path.resolve('requirements');
const outputFile = path.resolve('reports/test-cases.json');

async function main(): Promise<void> {
  const requirements = await readRequirements();
  const targetProject = getTargetProject();

  console.log(`Generating test cases for ${targetProject.name} from ${requirements.length} requirement file(s).`);

  const aiOutput = await runAiPrompt({
    system: 'You are a senior QA automation architect. Return only valid JSON, no markdown.',
    user: buildPrompt(requirements, targetProject.name),
    temperature: 0.1
  });

  const testCases = aiOutput ? parseAiTestCases(aiOutput) : buildMockTestCases(targetProject.name);
  await writeJsonFile(outputFile, testCases);

  console.log(`Saved ${testCases.length} test case(s) to ${outputFile}`);
}

async function readRequirements(): Promise<RequirementBundle[]> {
  const files = await listMarkdownFiles(requirementsDir);

  if (files.length === 0) {
    throw new Error(`No markdown requirement files found in ${requirementsDir}`);
  }

  return Promise.all(
    files.map(async (filePath) => ({
      fileName: path.basename(filePath),
      content: await readTextFile(filePath)
    }))
  );
}

function buildPrompt(requirements: RequirementBundle[], projectName: string): string {
  const requirementText = requirements.map((item) => `# ${item.fileName}\n${item.content}`).join('\n\n---\n\n');

  return `
Generate practical Playwright-ready test cases for ${projectName}.

Return JSON array only. Each item must match this TypeScript type:
{
  "id": string,
  "title": string,
  "description": string,
  "priority": "High" | "Medium" | "Low",
  "preconditions": string[],
  "steps": string[],
  "expectedResult": string,
  "testType": "UI" | "API" | "Visual" | "E2E",
  "tags": string[]
}

Requirements:
${requirementText}
`.trim();
}

function parseAiTestCases(raw: string): TestCase[] {
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as TestCase[];

  if (!Array.isArray(parsed)) {
    throw new Error('AI response must be a JSON array.');
  }

  return parsed;
}

function buildMockTestCases(projectName: string): TestCase[] {
  console.log('No AI API key found. Using deterministic mock test cases for local demo.');

  return [
    {
      id: 'TC-001',
      title: `${projectName} home page loads successfully`,
      description: 'Verify the target application opens and renders a useful first screen.',
      priority: 'High',
      preconditions: ['Target application is running', 'BASE_URL points to the target app'],
      steps: ['Open the application home page', 'Wait for the document to finish loading', 'Check that the page has a visible title or main landmark'],
      expectedResult: 'The application loads without browser errors and shows visible content.',
      testType: 'E2E',
      tags: ['smoke', 'homepage']
    },
    {
      id: 'TC-002',
      title: `${projectName} primary navigation is usable`,
      description: 'Verify that top-level navigation or primary call to action can be discovered.',
      priority: 'Medium',
      preconditions: ['Target application is running'],
      steps: ['Open the home page', 'Find a visible link or button', 'Verify the control has accessible text'],
      expectedResult: 'At least one accessible navigation control is visible.',
      testType: 'UI',
      tags: ['accessibility', 'navigation']
    },
    {
      id: 'TC-003',
      title: `${projectName} page has stable visual baseline`,
      description: 'Capture the first screen as a visual checkpoint for regression detection.',
      priority: 'Medium',
      preconditions: ['APPLITOOLS_API_KEY is configured for visual test execution'],
      steps: ['Open the application home page', 'Capture a visual checkpoint', 'Compare against the approved baseline'],
      expectedResult: 'The visual checkpoint matches the approved baseline or raises a reviewable difference.',
      testType: 'Visual',
      tags: ['visual', 'regression']
    }
  ];
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
