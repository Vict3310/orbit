export interface MedContextPayload {
  astronaut: { name: string; role: string };
  baseline: Record<string, number | string>;
  latest: Record<string, number | string>;
  alerts: { title: string; level: string; summary: string }[];
  scenario: string | null;
  environment: { co2: number; o2: number; eclssStatus: string };
  comms: string;
}

export interface MedAnswer {
  answer: string;
  sources: { label: string; url: string }[];
  model: string;
  mode: 'cloud';
}

export class MedUnavailableError extends Error {
  readonly code: string;
  constructor(message: string, code = 'AI_UNAVAILABLE') {
    super(message);
    this.name = 'MedUnavailableError';
    this.code = code;
  }
}

export async function askOrbitMed(
  question: string,
  context: MedContextPayload,
  history: { role: 'user' | 'assistant'; content: string }[],
  signal?: AbortSignal,
): Promise<MedAnswer> {
  let response: Response;
  try {
    response = await fetch('/api/med/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context, history }),
      signal,
    });
  } catch {
    throw new MedUnavailableError('The AI service is unreachable. Local explanations remain available.');
  }

  if (!response.ok) {
    let message = 'The AI service is not available. Local explanations remain available.';
    try {
      const body = (await response.json()) as { message?: string; error?: string };
      if (body.message) message = body.message;
      throw new MedUnavailableError(message, body.error ?? 'AI_UNAVAILABLE');
    } catch (error) {
      if (error instanceof MedUnavailableError) throw error;
      throw new MedUnavailableError(message);
    }
  }

  const data = (await response.json()) as Partial<MedAnswer>;
  if (!data.answer) {
    throw new MedUnavailableError('The AI service returned an empty explanation.');
  }
  return {
    answer: data.answer,
    sources: Array.isArray(data.sources) ? data.sources : [],
    model: data.model ?? 'unknown',
    mode: 'cloud',
  };
}
