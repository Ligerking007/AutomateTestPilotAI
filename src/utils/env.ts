import dotenv from 'dotenv';

dotenv.config();

export function getEnv(name: string, fallback = ''): string {
  return process.env[name] || fallback;
}

export function hasOpenAiConfig(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY));
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_MODEL || process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4.1-mini';
}

export function getBaseUrl(): string {
  return process.env.BASE_URL || 'https://example.com';
}
