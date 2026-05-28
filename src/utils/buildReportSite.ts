import path from 'node:path';
import { copyDirectoryIfExists, copyFileIfExists, writeTextFile } from './fileHelper.js';

async function main(): Promise<void> {
  await copyDirectoryIfExists(path.resolve('playwright-report'), path.resolve('public/playwright-report'));
  await copyFileIfExists(path.resolve('reports/ai-failure-analysis.md'), path.resolve('public/ai-failure-analysis.md'));
  await copyFileIfExists(path.resolve('reports/test-cases.json'), path.resolve('public/test-cases.json'));
  await copyFileIfExists(path.resolve('reports/manual-test-cases.json'), path.resolve('public/manual-test-cases.json'));
  await writeTextFile(path.resolve('public/index.html'), buildIndexHtml());

  console.log('Built static report site in public/');
}

function buildIndexHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>AutomateTestPilotAI Reports</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f7f9;
        --surface: #ffffff;
        --surface-alt: #eef4f2;
        --text: #101418;
        --muted: #5a6573;
        --panel: #ffffff;
        --line: #d7dde5;
        --line-strong: #b8c2cc;
        --accent: #0f766e;
        --accent-strong: #115e59;
        --blue: #1d4ed8;
        --amber: #a16207;
        --shadow: 0 14px 34px rgba(16, 20, 24, 0.08);
      }
      :root[data-theme="dark"] {
        color-scheme: dark;
        --bg: #0f141b;
        --surface: #151c25;
        --surface-alt: #10231f;
        --text: #f3f6f8;
        --muted: #a7b1bd;
        --panel: #151c25;
        --line: #2c3745;
        --line-strong: #3d4a5a;
        --accent: #14b8a6;
        --accent-strong: #5eead4;
        --blue: #60a5fa;
        --amber: #fbbf24;
        --shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: var(--bg);
        color: var(--text);
      }
      a {
        color: inherit;
      }
      .page {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
        padding: 28px 0 40px;
      }
      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 0 24px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .mark {
        display: grid;
        width: 38px;
        height: 38px;
        place-items: center;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        color: var(--accent-strong);
        font-weight: 800;
      }
      .brand-title {
        font-size: 16px;
        font-weight: 800;
        line-height: 1.2;
      }
      .brand-subtitle {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
      }
      .repo-link {
        display: inline-flex;
        align-items: center;
        min-height: 38px;
        padding: 0 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        color: var(--accent-strong);
        font-size: 14px;
        font-weight: 700;
        text-decoration: none;
        white-space: nowrap;
      }
      .site-nav {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .nav-links,
      .nav-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .nav-link,
      .nav-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 38px;
        padding: 0 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        color: var(--text);
        font: inherit;
        font-size: 13px;
        font-weight: 750;
        text-decoration: none;
        cursor: pointer;
      }
      .nav-link.active,
      .nav-button.active {
        border-color: rgba(15, 118, 110, 0.35);
        background: var(--surface-alt);
        color: var(--accent-strong);
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.6fr);
        gap: 20px;
        align-items: stretch;
        padding: 28px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
        box-shadow: var(--shadow);
      }
      h1 {
        max-width: 760px;
        margin: 0;
        font-size: 40px;
        line-height: 1.1;
        letter-spacing: 0;
      }
      p {
        margin: 0;
        color: var(--muted);
        font-size: 16px;
        line-height: 1.6;
      }
      .lede {
        max-width: 780px;
        margin-top: 14px;
      }
      .hero-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 22px;
      }
      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        padding: 0 14px;
        border-radius: 8px;
        border: 1px solid var(--accent);
        background: var(--accent);
        color: #ffffff;
        font-size: 14px;
        font-weight: 750;
        text-decoration: none;
      }
      .button.secondary {
        border-color: var(--line);
        background: var(--surface);
        color: var(--text);
      }
      .status-panel {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface-alt);
        padding: 18px;
      }
      .status-label {
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .status-value {
        margin-top: 8px;
        color: var(--accent-strong);
        font-size: 26px;
        font-weight: 850;
        line-height: 1.15;
      }
      .status-detail {
        margin-top: 8px;
        font-size: 14px;
      }
      .metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 16px;
      }
      .metric {
        min-height: 72px;
        padding: 12px;
        border: 1px solid rgba(15, 118, 110, 0.18);
        border-radius: 8px;
        background: var(--surface);
      }
      .metric strong {
        display: block;
        font-size: 20px;
        line-height: 1.1;
      }
      .metric span {
        display: block;
        margin-top: 6px;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.3;
      }
      .section {
        margin-top: 28px;
      }
      .section-head {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 14px;
      }
      h2 {
        margin: 0;
        font-size: 22px;
        line-height: 1.2;
        letter-spacing: 0;
      }
      .section-note {
        max-width: 520px;
        font-size: 14px;
        text-align: right;
      }
      .report-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 14px;
      }
      .card {
        display: flex;
        min-height: 188px;
        flex-direction: column;
        justify-content: space-between;
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        color: inherit;
        text-decoration: none;
      }
      a.card:hover {
        border-color: var(--accent);
        box-shadow: var(--shadow);
      }
      .card-kicker {
        color: var(--muted);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .card-title {
        display: block;
        margin-top: 12px;
        font-size: 18px;
        font-weight: 800;
        line-height: 1.25;
      }
      .card p {
        margin-top: 10px;
        font-size: 14px;
      }
      .card-cta {
        margin-top: 18px;
        color: var(--accent-strong);
        font-size: 14px;
        font-weight: 800;
      }
      .pipeline {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 10px;
      }
      .step {
        min-height: 120px;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
      }
      .step-num {
        color: var(--blue);
        font-size: 12px;
        font-weight: 850;
      }
      .step strong {
        display: block;
        margin-top: 10px;
        font-size: 15px;
        line-height: 1.25;
      }
      .step span {
        display: block;
        margin-top: 8px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .project-list {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }
      .project {
        min-height: 112px;
        padding: 16px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--surface);
      }
      .project strong {
        display: block;
        font-size: 16px;
      }
      .project span {
        display: block;
        margin-top: 8px;
        color: var(--muted);
        font-size: 13px;
        line-height: 1.45;
      }
      .command-list {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-top: 14px;
      }
      code {
        display: block;
        width: 100%;
        overflow-x: auto;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #0f172a;
        color: #e2e8f0;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.45;
        white-space: nowrap;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        margin-top: 28px;
        padding-top: 18px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-size: 13px;
      }
      .repo {
        color: var(--accent-strong);
        font-weight: 700;
      }
      @media (max-width: 860px) {
        .hero,
        .report-grid,
        .pipeline,
        .project-list,
        .command-list {
          grid-template-columns: 1fr;
        }
        .section-head {
          display: block;
        }
        .section-note {
          margin-top: 8px;
          text-align: left;
        }
      }
      @media (max-width: 620px) {
        .page {
          width: min(100% - 24px, 1120px);
          padding-top: 16px;
        }
        .topbar {
          align-items: flex-start;
          flex-direction: column;
        }
        .site-nav,
        .nav-links,
        .nav-controls,
        .repo-link,
        .nav-link,
        .nav-button {
          width: 100%;
        }
        .hero {
          padding: 20px;
        }
        h1 {
          font-size: 31px;
        }
        .metrics {
          grid-template-columns: 1fr;
        }
        .meta {
          display: block;
        }
        .meta span {
          display: block;
          margin-top: 6px;
          overflow-wrap: anywhere;
        }
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="topbar" aria-label="Site header">
        <div class="brand">
          <div class="mark" aria-hidden="true">TP</div>
          <div>
            <div class="brand-title">AutomateTestPilotAI</div>
            <div class="brand-subtitle" data-i18n="brandSubtitle">AI-powered Playwright automation framework</div>
          </div>
        </div>
        <nav class="site-nav" aria-label="Main navigation">
          <div class="nav-links">
            <a class="nav-link active" href="./index.html" data-i18n="navDashboard">Dashboard</a>
            <a class="nav-link" href="./manual-test-cases.html" data-i18n="navManual">Manual Cases</a>
            <a class="nav-link" href="./playwright-report/index.html" data-i18n="navReport">Playwright Report</a>
          </div>
          <div class="nav-controls" aria-label="Display preferences">
            <button class="nav-button" type="button" data-lang-toggle>TH</button>
            <button class="nav-button" type="button" data-theme-toggle>Dark</button>
          </div>
        </nav>
      </header>

      <section class="hero" aria-label="Overview">
        <div>
          <h1 data-i18n="heroTitle">Automation reports for AI-generated Playwright testing</h1>
          <p class="lede" data-i18n="heroText">A portfolio-ready test automation dashboard that connects requirements, generated test cases, Playwright execution, visual checks, and AI failure analysis in one deployable report site.</p>
          <div class="hero-actions">
            <a class="button" href="./playwright-report/index.html" data-i18n="openReport">Open Playwright Report</a>
            <a class="button secondary" href="./ai-failure-analysis.md" data-i18n="readAnalysis">Read AI Analysis</a>
            <a class="button secondary" href="./manual-test-cases.html" data-i18n="createManual">Create Manual Cases</a>
          </div>
        </div>
        <aside class="status-panel" aria-label="Latest run status">
          <div class="status-label" data-i18n="latestRun">Latest Run</div>
          <div class="status-value" data-i18n="readyReview">Ready for Review</div>
          <p class="status-detail" data-i18n="statusDetail">Generated reports are available from the latest local or CI workflow run.</p>
          <div class="metrics" aria-label="Report summary">
            <div class="metric">
              <strong>3</strong>
              <span data-i18n="metricCases">Generated test cases</span>
            </div>
            <div class="metric">
              <strong>3</strong>
              <span data-i18n="metricBrowsers">Browser engines configured</span>
            </div>
            <div class="metric">
              <strong>AI</strong>
              <span data-i18n="metricAnalysis">Failure analysis enabled</span>
            </div>
          </div>
        </aside>
      </section>

      <section class="section" aria-label="Report links">
        <div class="section-head">
          <h2 data-i18n="reportsTitle">Reports</h2>
          <p class="section-note" data-i18n="reportsNote">Open the artifact you need for debugging, review, or interview walkthroughs.</p>
        </div>
        <div class="report-grid">
          <a class="card" href="./playwright-report/index.html">
            <div>
              <div class="card-kicker">Execution</div>
              <strong class="card-title" data-i18n="playwrightReport">Playwright HTML Report</strong>
              <p data-i18n="playwrightReportText">Review browser runs, assertions, traces, screenshots, and videos captured on failure.</p>
            </div>
            <span class="card-cta" data-i18n="openReportShort">Open report</span>
          </a>
          <a class="card" href="./ai-failure-analysis.md">
            <div>
              <div class="card-kicker">Analysis</div>
              <strong class="card-title" data-i18n="failureAnalysis">AI Failure Analysis</strong>
              <p data-i18n="failureAnalysisText">Read the root cause summary, affected file, risk level, and recommended next action.</p>
            </div>
            <span class="card-cta" data-i18n="viewAnalysis">View analysis</span>
          </a>
          <a class="card" href="./test-cases.json">
            <div>
              <div class="card-kicker">Generation</div>
              <strong class="card-title" data-i18n="generatedCases">Generated Test Cases</strong>
              <p data-i18n="generatedCasesText">Inspect structured JSON created from markdown requirements and used by the spec generator.</p>
            </div>
            <span class="card-cta" data-i18n="viewJson">View JSON</span>
          </a>
          <a class="card" href="./manual-test-cases.html">
            <div>
              <div class="card-kicker">Manual Input</div>
              <strong class="card-title" data-i18n="manualUi">Manual Test Case UI</strong>
              <p data-i18n="manualUiText">Create, import, export, and review manual cases before merging them into generated specs.</p>
            </div>
            <span class="card-cta" data-i18n="createCases">Create cases</span>
          </a>
        </div>
      </section>

      <section class="section" aria-label="Automation pipeline">
        <div class="section-head">
          <h2 data-i18n="pipelineTitle">Automation Pipeline</h2>
          <p class="section-note" data-i18n="pipelineNote">The workflow turns product requirements into executable tests and reviewable reports.</p>
        </div>
        <div class="pipeline">
          <div class="step">
            <div class="step-num">01</div>
            <strong data-i18n="stepRequirements">Requirements</strong>
            <span data-i18n="stepRequirementsText">Markdown files describe expected product behavior.</span>
          </div>
          <div class="step">
            <div class="step-num">02</div>
            <strong data-i18n="stepCases">AI or Manual Cases</strong>
            <span data-i18n="stepCasesText">AI and manual input create structured cases with steps, priority, and tags.</span>
          </div>
          <div class="step">
            <div class="step-num">03</div>
            <strong data-i18n="stepSpecs">AI Specs</strong>
            <span data-i18n="stepSpecsText">Generated Playwright specs use assertions and stable locator guidance.</span>
          </div>
          <div class="step">
            <div class="step-num">04</div>
            <strong data-i18n="stepRun">Test Run</strong>
            <span data-i18n="stepRunText">Playwright runs browser checks and stores debug artifacts.</span>
          </div>
          <div class="step">
            <div class="step-num">05</div>
            <strong data-i18n="stepAnalysis">AI Analysis</strong>
            <span data-i18n="stepAnalysisText">Failures are summarized into actionable engineering notes.</span>
          </div>
        </div>
      </section>

      <section class="section" aria-label="Target projects">
        <div class="section-head">
          <h2 data-i18n="targetProjects">Target Projects</h2>
          <p class="section-note" data-i18n="targetProjectsText">The same framework can run against multiple portfolio applications.</p>
        </div>
        <div class="project-list">
          <div class="project">
            <strong>DevPilotAI</strong>
            <span data-i18n="devpilotText">AI developer assistant application tested through configurable base URLs.</span>
          </div>
          <div class="project">
            <strong>CodeReviewPilotAI</strong>
            <span data-i18n="codereviewText">AI code review workflow checks for smoke, navigation, and generated scenarios.</span>
          </div>
          <div class="project">
            <strong>JakapanKPortfolio</strong>
            <span data-i18n="portfolioText">Public portfolio UI validated with smoke and visual regression-ready checks.</span>
          </div>
        </div>
        <div class="command-list" aria-label="Project runner commands">
          <code>npm run test:devpilot</code>
          <code>npm run test:codereview</code>
          <code>npm run test:portfolio</code>
        </div>
      </section>

      <footer class="meta">
        <span data-i18n="footerGenerated">Report site generated by AutomateTestPilotAI</span>
        <span>Repository: <span class="repo">github.com/Ligerking007/AutomateTestPilotAI</span></span>
      </footer>
    </main>
    <script>
      const messages = {
        en: {
          brandSubtitle: 'AI-powered Playwright automation framework',
          navDashboard: 'Dashboard',
          navManual: 'Manual Cases',
          navReport: 'Playwright Report',
          heroTitle: 'Automation reports for AI-generated Playwright testing',
          heroText: 'A portfolio-ready test automation dashboard that connects requirements, generated test cases, Playwright execution, visual checks, and AI failure analysis in one deployable report site.',
          openReport: 'Open Playwright Report',
          readAnalysis: 'Read AI Analysis',
          createManual: 'Create Manual Cases',
          latestRun: 'Latest Run',
          readyReview: 'Ready for Review',
          statusDetail: 'Generated reports are available from the latest local or CI workflow run.',
          metricCases: 'Generated test cases',
          metricBrowsers: 'Browser engines configured',
          metricAnalysis: 'Failure analysis enabled',
          reportsTitle: 'Reports',
          reportsNote: 'Open the artifact you need for debugging, review, or interview walkthroughs.',
          playwrightReport: 'Playwright HTML Report',
          playwrightReportText: 'Review browser runs, assertions, traces, screenshots, and videos captured on failure.',
          openReportShort: 'Open report',
          failureAnalysis: 'AI Failure Analysis',
          failureAnalysisText: 'Read the root cause summary, affected file, risk level, and recommended next action.',
          viewAnalysis: 'View analysis',
          generatedCases: 'Generated Test Cases',
          generatedCasesText: 'Inspect structured JSON created from markdown requirements and used by the spec generator.',
          viewJson: 'View JSON',
          manualUi: 'Manual Test Case UI',
          manualUiText: 'Create, import, export, and review manual cases before merging them into generated specs.',
          createCases: 'Create cases',
          pipelineTitle: 'Automation Pipeline',
          pipelineNote: 'The workflow turns product requirements into executable tests and reviewable reports.',
          stepRequirements: 'Requirements',
          stepRequirementsText: 'Markdown files describe expected product behavior.',
          stepCases: 'AI or Manual Cases',
          stepCasesText: 'AI and manual input create structured cases with steps, priority, and tags.',
          stepSpecs: 'AI Specs',
          stepSpecsText: 'Generated Playwright specs use assertions and stable locator guidance.',
          stepRun: 'Test Run',
          stepRunText: 'Playwright runs browser checks and stores debug artifacts.',
          stepAnalysis: 'AI Analysis',
          stepAnalysisText: 'Failures are summarized into actionable engineering notes.',
          targetProjects: 'Target Projects',
          targetProjectsText: 'The same framework can run against multiple portfolio applications.',
          devpilotText: 'AI developer assistant application tested through configurable base URLs.',
          codereviewText: 'AI code review workflow checks for smoke, navigation, and generated scenarios.',
          portfolioText: 'Public portfolio UI validated with smoke and visual regression-ready checks.',
          footerGenerated: 'Report site generated by AutomateTestPilotAI'
        },
        th: {
          brandSubtitle: 'เฟรมเวิร์ก Playwright automation ที่ใช้ AI ช่วยทำงาน',
          navDashboard: 'หน้าหลัก',
          navManual: 'Manual Cases',
          navReport: 'รายงาน Playwright',
          heroTitle: 'แดชบอร์ดรายงานสำหรับ Playwright testing ที่ใช้ AI',
          heroText: 'แดชบอร์ด automation สำหรับ portfolio ที่เชื่อม requirement, test cases, Playwright execution, visual checks และ AI failure analysis ไว้ในที่เดียว',
          openReport: 'เปิด Playwright Report',
          readAnalysis: 'อ่าน AI Analysis',
          createManual: 'สร้าง Manual Cases',
          latestRun: 'ผลรันล่าสุด',
          readyReview: 'พร้อมตรวจสอบ',
          statusDetail: 'รายงานถูกสร้างจาก local หรือ CI workflow ล่าสุด',
          metricCases: 'Generated test cases',
          metricBrowsers: 'Browser engines ที่ตั้งค่าไว้',
          metricAnalysis: 'เปิดใช้ failure analysis',
          reportsTitle: 'รายงาน',
          reportsNote: 'เปิด artifact ที่ต้องใช้สำหรับ debug, review หรือ demo ตอนสัมภาษณ์',
          playwrightReport: 'Playwright HTML Report',
          playwrightReportText: 'ดูผลรัน browser, assertions, traces, screenshots และ videos เมื่อ test fail',
          openReportShort: 'เปิดรายงาน',
          failureAnalysis: 'AI Failure Analysis',
          failureAnalysisText: 'อ่าน root cause, affected file, risk level และ recommended next action',
          viewAnalysis: 'ดู analysis',
          generatedCases: 'Generated Test Cases',
          generatedCasesText: 'ดู JSON test cases ที่สร้างจาก markdown requirements และใช้ต่อกับ spec generator',
          viewJson: 'ดู JSON',
          manualUi: 'Manual Test Case UI',
          manualUiText: 'สร้าง import export และตรวจ manual cases ก่อน merge เข้า generated specs',
          createCases: 'สร้าง cases',
          pipelineTitle: 'Automation Pipeline',
          pipelineNote: 'Workflow เปลี่ยน product requirements ให้เป็น executable tests และ reviewable reports',
          stepRequirements: 'Requirements',
          stepRequirementsText: 'Markdown files อธิบายพฤติกรรมที่ระบบควรทำได้',
          stepCases: 'AI หรือ Manual Cases',
          stepCasesText: 'AI และ manual input สร้าง structured cases พร้อม steps, priority และ tags',
          stepSpecs: 'AI Specs',
          stepSpecsText: 'Generated Playwright specs ใช้ assertions และ locator guidance ที่เสถียร',
          stepRun: 'Test Run',
          stepRunText: 'Playwright รัน browser checks และเก็บ debug artifacts',
          stepAnalysis: 'AI Analysis',
          stepAnalysisText: 'สรุป failures เป็น engineering notes ที่นำไปแก้ต่อได้',
          targetProjects: 'Target Projects',
          targetProjectsText: 'Framework เดียวกันใช้รันกับหลาย portfolio applications ได้',
          devpilotText: 'AI developer assistant ที่ test ผ่าน base URL ที่ config ได้',
          codereviewText: 'AI code review workflow สำหรับ smoke, navigation และ generated scenarios',
          portfolioText: 'Portfolio UI ที่ตรวจด้วย smoke checks และพร้อมต่อยอด visual regression',
          footerGenerated: 'Report site generated by AutomateTestPilotAI'
        }
      };

      const root = document.documentElement;
      const langButton = document.querySelector('[data-lang-toggle]');
      const themeButton = document.querySelector('[data-theme-toggle]');

      function applyLanguage(lang) {
        const active = messages[lang] ? lang : 'en';
        root.lang = active;
        localStorage.setItem('automate-test-pilot-ai.lang', active);
        document.querySelectorAll('[data-i18n]').forEach((node) => {
          const key = node.getAttribute('data-i18n');
          node.textContent = messages[active][key] || node.textContent;
        });
        langButton.textContent = active === 'en' ? 'TH' : 'EN';
      }

      function applyTheme(theme) {
        const active = theme === 'dark' ? 'dark' : 'light';
        root.dataset.theme = active;
        localStorage.setItem('automate-test-pilot-ai.theme', active);
        themeButton.textContent = active === 'dark' ? 'Light' : 'Dark';
      }

      langButton.addEventListener('click', () => {
        applyLanguage((localStorage.getItem('automate-test-pilot-ai.lang') || 'en') === 'en' ? 'th' : 'en');
      });
      themeButton.addEventListener('click', () => {
        applyTheme((localStorage.getItem('automate-test-pilot-ai.theme') || 'light') === 'light' ? 'dark' : 'light');
      });

      applyTheme(localStorage.getItem('automate-test-pilot-ai.theme') || 'light');
      applyLanguage(localStorage.getItem('automate-test-pilot-ai.lang') || 'en');
    </script>
  </body>
</html>
`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
