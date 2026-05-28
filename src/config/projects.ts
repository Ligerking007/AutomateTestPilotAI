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

export function getTargetProject(id = process.env.TARGET_PROJECT || 'portfolio'): TargetProject {
  const project = targetProjects.find((item) => item.id === id);

  if (!project) {
    const validTargets = targetProjects.map((item) => item.id).join(', ');
    throw new Error(`Unknown TARGET_PROJECT "${id}". Valid values: ${validTargets}`);
  }

  return project;
}
