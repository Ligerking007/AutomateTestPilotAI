export type TestPriority = 'High' | 'Medium' | 'Low';
export type TestType = 'UI' | 'API' | 'Visual' | 'E2E';

export interface TestCase {
  id: string;
  title: string;
  description: string;
  priority: TestPriority;
  preconditions: string[];
  steps: string[];
  expectedResult: string;
  testType: TestType;
  tags: string[];
}

export interface RequirementBundle {
  fileName: string;
  content: string;
}

export interface TargetProject {
  id: string;
  name: string;
  localPath: string;
  defaultBaseUrl: string;
  description: string;
  tags: string[];
}
