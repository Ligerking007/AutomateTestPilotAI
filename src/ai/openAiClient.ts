import OpenAI from 'openai';
import { getOpenAiModel, hasOpenAiConfig } from '../utils/env.js';

export interface ChatRequest {
  system: string;
  user: string;
  temperature?: number;
}

export async function runAiPrompt(request: ChatRequest): Promise<string | null> {
  if (!hasOpenAiConfig()) {
    return null;
  }

  const client = createClient();
  const response = await client.chat.completions.create({
    model: getOpenAiModel(),
    temperature: request.temperature ?? 0.2,
    messages: [
      { role: 'system', content: request.system },
      { role: 'user', content: request.user }
    ]
  });

  return response.choices[0]?.message?.content ?? null;
}

function createClient(): OpenAI {
  if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) {
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';

    if (!deployment) {
      throw new Error('AZURE_OPENAI_DEPLOYMENT is required when Azure OpenAI is enabled.');
    }

    return new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, '')}/openai/deployments/${deployment}`,
      defaultQuery: { 'api-version': apiVersion },
      defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY }
    });
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}
