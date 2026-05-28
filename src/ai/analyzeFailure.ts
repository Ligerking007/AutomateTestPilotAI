import path from 'node:path';
import { runAiPrompt } from './openAiClient.js';
import { readJsonFile, writeTextFile } from '../utils/fileHelper.js';

interface PlaywrightJsonReport {
  suites?: Suite[];
}

interface Suite {
  title?: string;
  file?: string;
  suites?: Suite[];
  specs?: Spec[];
}

interface Spec {
  title: string;
  file?: string;
  tests?: TestResult[];
}

interface TestResult {
  projectName?: string;
  results?: ResultAttempt[];
}

interface ResultAttempt {
  retry: number;
  status: string;
  error?: {
    message?: string;
    stack?: string;
  };
  attachments?: Array<{
    name: string;
    path?: string;
    contentType?: string;
  }>;
}

interface FailureSummary {
  title: string;
  file: string;
  projectName: string;
  errorMessage: string;
  stackTrace: string;
  screenshotPath: string;
  videoPath: string;
  tracePath: string;
  retryCount: number;
}

const reportFile = path.resolve('reports/playwright-results.json');
const outputFile = path.resolve('reports/ai-failure-analysis.md');

async function main(): Promise<void> {
  let report: PlaywrightJsonReport;

  try {
    report = await readJsonFile<PlaywrightJsonReport>(reportFile);
  } catch {
    await writeTextFile(outputFile, '# AI Failure Analysis\n\nNo Playwright JSON report found yet. Run `npm test` first.\n');
    console.log(`No JSON report found. Created placeholder at ${outputFile}`);
    return;
  }

  const failures = collectFailures(report);

  if (failures.length === 0) {
    await writeTextFile(outputFile, '# AI Failure Analysis\n\nNo failed tests detected in the latest Playwright JSON report.\n');
    console.log(`No failures detected. Saved ${outputFile}`);
    return;
  }

  const aiOutput = await runAiPrompt({
    system: 'You are a senior test automation engineer. Write concise markdown for developers.',
    user: buildPrompt(failures),
    temperature: 0.2
  });

  const markdown = aiOutput ?? buildMockAnalysis(failures);
  await writeTextFile(outputFile, markdown);
  console.log(`Saved AI failure analysis for ${failures.length} failed test(s) to ${outputFile}`);
}

function collectFailures(report: PlaywrightJsonReport): FailureSummary[] {
  const failures: FailureSummary[] = [];

  for (const suite of report.suites ?? []) {
    walkSuite(suite, failures);
  }

  return failures;
}

function walkSuite(suite: Suite, failures: FailureSummary[]): void {
  for (const child of suite.suites ?? []) {
    walkSuite(child, failures);
  }

  for (const spec of suite.specs ?? []) {
    for (const testResult of spec.tests ?? []) {
      const failedAttempts = (testResult.results ?? []).filter((result) => result.status === 'failed' || result.status === 'timedOut');

      for (const attempt of failedAttempts) {
        failures.push({
          title: spec.title,
          file: spec.file || suite.file || 'unknown',
          projectName: testResult.projectName || 'unknown',
          errorMessage: attempt.error?.message || 'No error message provided',
          stackTrace: attempt.error?.stack || 'No stack trace provided',
          screenshotPath: findAttachment(attempt, 'screenshot'),
          videoPath: findAttachment(attempt, 'video'),
          tracePath: findAttachment(attempt, 'trace'),
          retryCount: attempt.retry
        });
      }
    }
  }
}

function findAttachment(result: ResultAttempt, name: string): string {
  return result.attachments?.find((attachment) => attachment.name.includes(name))?.path || 'not captured';
}

function buildPrompt(failures: FailureSummary[]): string {
  return `
Analyze these Playwright failures and produce markdown with these sections for each failure:
Summary, Root Cause, Failed Step, Possible Fix, Affected File, Risk Level, Recommended Next Action.

Failures:
${JSON.stringify(failures, null, 2)}
`.trim();
}

function buildMockAnalysis(failures: FailureSummary[]): string {
  const sections = failures.map((failure) => `## ${failure.title}

### Summary
The test failed in project \`${failure.projectName}\` with error: ${failure.errorMessage}

### Root Cause
AI credentials are not configured, so this local demo provides a deterministic analysis. Review the failing locator, navigation target, or application availability.

### Failed Step
The failure occurred during Playwright execution. Inspect the stack trace and trace artifact.

### Possible Fix
Confirm \`BASE_URL\`, ensure the target application is running, and update selectors to use accessible locators such as \`getByRole\`, \`getByLabel\`, or \`getByTestId\`.

### Affected File
\`${failure.file}\`

### Risk Level
Medium

### Recommended Next Action
Open the Playwright trace and verify whether this is an application regression, environment issue, or selector drift.

- Screenshot: ${failure.screenshotPath}
- Video: ${failure.videoPath}
- Trace: ${failure.tracePath}
- Retry Count: ${failure.retryCount}
`);

  return `# AI Failure Analysis\n\n${sections.join('\n')}`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
