import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'resolveloop-api' });
  });

  app.post('/api/ai/analyze-complaint', async (req: Request, res: Response) => {
    const { category, orderId, title, description, urgency } = req.body ?? {};
    if (!title && !description) {
      return res.status(400).json({ error: 'Please provide a complaint title or description to analyze.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server. Add GEMINI_API_KEY in Settings > Secrets.',
      });
    }

    try {
      const prompt = [
        'You are the ResolveLoop AI Complaint Triage Engine.',
        'Analyze this customer complaint and produce concise, actionable structured triage metadata.',
        `Category: ${String(category || 'General')}`,
        `Order/Reference ID: ${String(orderId || 'Not provided')}`,
        `Urgency Selected: ${String(urgency || 'Medium')}`,
        `Title: ${String(title || '')}`,
        `Description: ${String(description || '')}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'Be concise, practical, and empathetic. Keep classification under 40 chars, detectedPriority under 40 chars, claritySummary under 90 chars, suggestion under 180 chars, estimatedResolution under 30 chars, and assignedTeam under 45 chars.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              classification: {
                type: Type.STRING,
                description: 'Domain > Subtype label, e.g. Billing > Refund Delay',
              },
              detectedPriority: {
                type: Type.STRING,
                description: 'Urgency and context, e.g. High - 12 days overdue',
              },
              clarityScore: {
                type: Type.INTEGER,
                description: 'Clarity score between 35 and 99 based on details, dates, and order ID presence.',
              },
              clarityLabel: {
                type: Type.STRING,
                description: 'Short label like Clear & Actionable or Needs Order Details',
              },
              claritySummary: {
                type: Type.STRING,
                description: 'One short sentence explaining the clarity assessment.',
              },
              suggestion: {
                type: Type.STRING,
                description: 'Actionable recommendation to expedite resolution.',
              },
              estimatedResolution: {
                type: Type.STRING,
                description: 'Expected SLA timeframe, e.g. 3-4 working days',
              },
              assignedTeam: {
                type: Type.STRING,
                description: 'Target team, e.g. Billing Support Team',
              },
            },
            required: [
              'classification',
              'detectedPriority',
              'clarityScore',
              'clarityLabel',
              'claritySummary',
              'suggestion',
              'estimatedResolution',
              'assignedTeam',
            ],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      return res.json(parsed);
    } catch (error: unknown) {
      console.error('Gemini analyze-complaint error:', error);
      const message = error instanceof Error ? error.message : 'Failed to analyze complaint with AI';
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/ai/agent-reply', async (req: Request, res: Response) => {
    const { ticketCode, title, category, customerMessage, agentName } = req.body ?? {};
    if (!customerMessage) {
      return res.status(400).json({ error: 'Customer message is required.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server.',
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Ticket: ${String(ticketCode || '')} (${String(title || '')}, ${String(category || '')}). Customer wrote: "${String(customerMessage)}". Reply concisely in 2 sentences as ${String(agentName || 'Rahul Verma')}, a helpful senior support specialist.`,
      });

      return res.json({ reply: (response.text ?? '').trim() });
    } catch (error: unknown) {
      console.error('Gemini agent-reply error:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate agent reply';
      return res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ResolveLoop server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
