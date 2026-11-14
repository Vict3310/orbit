import 'dotenv/config';

const parseOrigins = (value: string | undefined): string[] =>
  (value ?? 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  port: Number(process.env.PORT ?? 8787),
  openAiKey: (process.env.OPENAI_API_KEY ?? '').trim(),
  model: (process.env.OPENAI_MODEL ?? 'gpt-4o-mini').trim() || 'gpt-4o-mini',
  clientOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export const AI_CONFIGURED = env.openAiKey.length > 0;
