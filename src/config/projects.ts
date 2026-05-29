import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { TargetProject } from '../types/testCase.js';

export const targetProjects: TargetProject[] = [
  {
    id: 'devpilotai',
    name: 'DevPilotAI',
    localPath: '/Users/jakapank/SourceCode/DevPilotAI',
    defaultBaseUrl: process.env.DEV_PILOT_AI_URL || 'http://localhost:3000',
    description: 'AI developer assistant application.',
    tags: ['devpilotai', 'ai', 'developer-tools']
  },
  {
    id: 'codereviewpilotai',
    name: 'CodeReviewPilotAI',
    localPath: '/Users/jakapank/SourceCode/CodeReviewPilotAI',
    defaultBaseUrl: process.env.CODE_REVIEW_PILOT_AI_URL || 'http://localhost:3001',
    description: 'AI code review assistant application.',
    tags: ['codereviewpilotai', 'code-review', 'ai']
  },
  {
    id: 'portfolio',
    name: 'JakapanKPortfolio',
    localPath: '/Users/jakapank/SourceCode/JakapanKPortfolio',
    defaultBaseUrl: process.env.PORTFOLIO_URL || 'http://localhost:3002',
    description: 'Personal portfolio site.',
    tags: ['portfolio', 'public-site', 'ui']
  }
];

const localProjectsFile = path.resolve('config/local-projects.json');

export function getLocalTargetProjects(): TargetProject[] {
  if (!existsSync(localProjectsFile)) {
    return [];
  }

  const rawProjects = JSON.parse(readFileSync(localProjectsFile, 'utf8')) as Partial<TargetProject>[];

  if (!Array.isArray(rawProjects)) {
    throw new Error(`${localProjectsFile} must contain a JSON array.`);
  }

  return rawProjects.map((project) => normalizeLocalProject(project));
}

export function getAllTargetProjects(): TargetProject[] {
  const projectMap = new Map<string, TargetProject>();

  for (const project of targetProjects) {
    projectMap.set(project.id, project);
  }

  for (const project of getLocalTargetProjects()) {
    projectMap.set(project.id, project);
  }

  return Array.from(projectMap.values());
}

export function getTargetProject(id = process.env.TARGET_PROJECT || 'portfolio'): TargetProject {
  const projects = getAllTargetProjects();
  const project = projects.find((item) => item.id === id);

  if (!project) {
    const validTargets = projects.map((item) => item.id).join(', ');
    throw new Error(`Unknown TARGET_PROJECT "${id}". Valid values: ${validTargets}`);
  }

  return project;
}

function normalizeLocalProject(project: Partial<TargetProject>): TargetProject {
  if (!project.id || !project.name || !project.defaultBaseUrl) {
    throw new Error('Local target projects require id, name, and defaultBaseUrl.');
  }

  return {
    id: project.id,
    name: project.name,
    localPath: project.localPath || '',
    defaultBaseUrl: project.defaultBaseUrl,
    description: project.description || 'Local target project.',
    tags: project.tags || ['local']
  };
}
