import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { getModelForAttempt } from '../utils/modelSelection';

const apiKey = process.env.GROQ_API_KEY?.trim() ?? null;
const groq = apiKey ? new Groq({ apiKey }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!groq) return res.status(500).json({ text: 'GROQ_API_KEY is not configured on the server.' });

  const maxRetries = 3;
  let attempt = 0;
  let currentModel = '';

  while (attempt <= maxRetries) {
    try {
      const { prompt, options } = req.body;

      const model = getModelForAttempt(options?.modelType, attempt);
      currentModel = model;

      const messages: any[] = [];
      if (options?.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });

      if (Array.isArray(prompt)) {
        prompt.forEach((msg: any) => {
          const role = msg.role === 'model' ? 'assistant' : 'user';
          const content = msg.parts?.map((p: any) => String(p.text || '')).join('\n') ?? JSON.stringify(msg);
          messages.push({ role, content: String(content) });
        });
      } else {
        messages.push({ role: 'user', content: String(prompt) });
      }

      const response = await groq.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      });

      return res.json({
        text: response.choices[0]?.message?.content ?? 'No response generated.',
        modelUsed: model,
      });
    } catch (error: any) {
      attempt++;
      const isRateLimit = error?.status === 429 || error?.message?.includes('429');
      if (isRateLimit && attempt <= maxRetries) {
        await new Promise(r => setTimeout(r, Math.pow(3, attempt) * 1000));
        continue;
      }
      console.error('Groq error:', error);
      return res.status(500).json({ text: 'I encountered an error connecting to the AI service.' });
    }
  }
}
