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
        // Shorter wait for Vercel to avoid 10s timeout limit on Hobby tier
        await new Promise(r => setTimeout(r, attempt * 1000));
        continue;
      }
      
      console.error('Groq error:', error);
      let errorMessage = "I encountered an error connecting to the campus network.";
      
      if (error?.message?.includes("Invalid API Key")) {
        errorMessage = "The Groq API key is invalid. Please update your API key in the application settings.";
      } else if (isRateLimit) {
        errorMessage = "The AI service quota has been exceeded. Please try again later or check your Groq API limits.";
      } else if (error?.status === 503 || error?.message?.includes("high demand") || error?.message?.includes("UNAVAILABLE")) {
        errorMessage = "The AI model is currently experiencing high demand. I tried multiple times but the service is still overloaded. Please try again in a minute.";
      } else if (error?.status === 400 || error?.status === 401 || error?.status === 403) {
        errorMessage = "Authentication or configuration error with the AI service. Please check your API key.";
      }

      return res.status(500).json({ text: errorMessage });
    }
  }
}
