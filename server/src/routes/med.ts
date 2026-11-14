import { Router } from 'express';
import { z } from 'zod';
import { AI_CONFIGURED, env } from '../config/env.js';
import { ALLOWED_SOURCES, SYSTEM_PROMPT } from '../services/prompt.js';
import { rateLimit } from '../middleware/rateLimit.js';

const numericMap = z.record(z.string(), z.union([z.number(), z.string(), z.null()]));

export const medRequestSchema = z.object({
  question: z.string().trim().min(3).max(600),
  context: z.object({
    astronaut: z.object({
      name: z.string().max(80),
      role: z.string().max(120),
    }),
    baseline: numericMap.default({}),
    latest: numericMap.default({}),
    alerts: z
      .array(
        z.object({
          title: z.string().max(140),
          level: z.string().max(30),
          summary: z.string().max(600),
        }),
      )
      .max(8)
      .default([]),
    scenario: z.string().max(140).nullable(),
    environment: z.object({
      co2: z.number(),
      o2: z.number(),
      eclssStatus: z.string().max(40),
    }),
    comms: z.string().max(40),
  }),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(1500),
      }),
    )
    .max(8)
    .default([]),
});

type MedRequest = z.infer<typeof medRequestSchema>;

function toText(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return 'n/a';
  return typeof value === 'number' ? String(Number(value.toFixed(2))) : String(value);
}

function buildUserMessage(payload: MedRequest): string {
  const { context } = payload;
  const alertLines =
    context.alerts.length === 0
      ? 'No active deterministic alerts.'
      : context.alerts
          .map((alert) => `- [${alert.level}] ${alert.title}: ${alert.summary}`)
          .join('\n');

  return `READ-ONLY SYNTHETIC MISSION SNAPSHOT

Crew member: ${context.astronaut.name} (${context.astronaut.role})
Active scenario: ${context.scenario ?? 'none'}
Communication: ${context.comms}
Environment: CO2 ${context.environment.co2} ppm, O2 ${context.environment.o2}%, life-support status ${context.environment.eclssStatus}

Personal simulated baseline:
${Object.entries(context.baseline)
  .map(([key, value]) => `- ${key}: ${toText(value)}`)
  .join('\n') || '- unavailable'}

Latest simulated observation:
${Object.entries(context.latest)
  .map(([key, value]) => `- ${key}: ${toText(value)}`)
  .join('\n') || '- unavailable'}

Deterministic alerts:
${alertLines}

Question from the crew interface: ${payload.question}

Explain using only this snapshot. Do not diagnose, prescribe, invent measurements, or claim clinical validation.`;
}

export const medRouter = Router();

medRouter.use(rateLimit({ limit: 12, windowMs: 60_000 }));

medRouter.post('/explain', async (request, response) => {
  const parsed = medRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      error: 'INVALID_REQUEST',
      message: 'The explanation request did not match the expected schema.',
    });
    return;
  }

  if (!AI_CONFIGURED) {
    response.status(503).json({
      error: 'AI_NOT_CONFIGURED',
      message:
        'The optional AI service is not configured. ORBIT is using its local explanation engine; all monitoring and simulation features remain available.',
    });
    return;
  }

  const payload = parsed.data;
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...payload.history.map((message) => ({ role: message.role, content: message.content })),
    { role: 'user' as const, content: buildUserMessage(payload) },
  ];

  try {
    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.openAiKey}`,
      },
      body: JSON.stringify({
        model: env.model,
        messages,
        temperature: 0.2,
        max_tokens: 480,
      }),
      signal: AbortSignal.timeout(22_000),
    });

    if (!upstream.ok) {
      const status = upstream.status;
      if (status === 401 || status === 403) {
        response.status(502).json({
          error: 'AI_AUTH_FAILED',
          message:
            'The configured AI credential was rejected. ORBIT will continue with the local explanation engine.',
        });
        return;
      }
      if (status === 429) {
        response.status(429).json({
          error: 'AI_RATE_LIMITED',
          message: 'The AI service is rate limited. Local explanations remain available.',
        });
        return;
      }
      response.status(502).json({
        error: 'AI_UPSTREAM_ERROR',
        message: 'The AI service could not complete the request. Local explanations remain available.',
      });
      return;
    }

    const body = (await upstream.json()) as {
      model?: string;
      choices?: { message?: { content?: string } }[];
    };
    const answer = body.choices?.[0]?.message?.content?.trim();
    if (!answer) {
      response.status(502).json({
        error: 'AI_EMPTY_RESPONSE',
        message: 'The AI service returned no explanation. Local explanations remain available.',
      });
      return;
    }

    response.json({
      answer,
      sources: ALLOWED_SOURCES,
      model: body.model ?? env.model,
      mode: 'cloud',
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'TimeoutError';
    response.status(aborted ? 504 : 502).json({
      error: aborted ? 'AI_TIMEOUT' : 'AI_UNAVAILABLE',
      message: 'The AI explanation service is unavailable. Local explanations remain available.',
    });
  }
});
