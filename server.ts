import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_ID = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY is not configured in server environment.');
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

interface GroundingLink {
  title: string;
  uri: string;
}

function extractGroundingLinks(response: unknown): GroundingLink[] {
  const res = response as {
    candidates?: Array<{
      groundingMetadata?: {
        groundingChunks?: Array<{
          web?: { uri?: string; title?: string };
        }>;
      };
    }>;
  };
  const chunks = res.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const seen = new Set<string>();
  const links: GroundingLink[] = [];
  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    const title = chunk.web?.title || uri;
    if (uri && title && !seen.has(uri)) {
      seen.add(uri);
      links.push({ title, uri });
    }
  }
  return links.slice(0, 8);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, model: MODEL_ID });
  });

  // REB & NESA Web-Grounded Teaching Assistant
  app.post('/api/ai/reb-nesa', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        question?: string;
        subject?: string;
        gradeLevel?: string;
        language?: string;
      };
      const question = String(body.question || '').trim().slice(0, 1500);
      if (!question) {
        res.status(400).json({ error: 'Please provide a question or topic to search.' });
        return;
      }

      const subject = String(body.subject || 'All Primary Subjects').slice(0, 80);
      const gradeLevel = String(body.gradeLevel || 'Nursery – Primary 6').slice(0, 60);
      const language = String(body.language || 'English').slice(0, 40);

      const ai = getGeminiClient();
      const prompt = [
        `You are the Academic Curriculum & Teaching Assistant for EP Saint Pierre Nkombo (Primary School, Rusizi District, Rwanda).`,
        `Search and ground your answer using official Rwanda Basic Education Board (REB - reb.rw, elearning.reb.rw), NESA (nesa.gov.rw), CAMIS, Karame Beruro literacy updates, and Rwanda Competence-Based Curriculum (CBC) learning resources.`,
        `Subject Focus: ${subject}`,
        `Grade Level: ${gradeLevel}`,
        `Respond in ${language} with clear, practical headings, learning objectives, classroom exercises, and concrete references to REB/NESA syllabi or official updates when available.`,
        ``,
        `Teacher/User Query: ${question}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const answer = response.text || 'No response generated. Please refine your query.';
      const sources = extractGroundingLinks(response);

      res.json({
        answer,
        sources,
      });
    } catch (err) {
      console.error('AI REB/NESA error:', err);
      const message =
        err instanceof Error ? err.message : 'Unable to reach AI Teaching Assistant right now.';
      res.status(500).json({ error: message });
    }
  });

  // Trainable Rwanda CBC Lesson Plan Generator
  app.post('/api/ai/lesson-plan', async (req: Request, res: Response) => {
    try {
      const body = req.body as {
        subject?: string;
        gradeLevel?: string;
        topic?: string;
        durationMinutes?: number;
        language?: string;
        trainerNotes?: string;
        classSize?: number;
        specialNeedsNote?: string;
        useWebGrounding?: boolean;
      };

      const topic = String(body.topic || '').trim().slice(0, 400);
      if (!topic) {
        res.status(400).json({ error: 'Please specify a lesson topic or unit.' });
        return;
      }

      const subject = String(body.subject || 'MATHEMATICS').slice(0, 80);
      const gradeLevel = String(body.gradeLevel || 'Primary 5').slice(0, 60);
      const duration = Math.max(20, Math.min(120, Number(body.durationMinutes) || 40));
      const language = String(body.language || 'English').slice(0, 40);
      const classSize = Math.max(5, Math.min(120, Number(body.classSize) || 32));
      const trainerNotes = String(body.trainerNotes || '').trim().slice(0, 2000);
      const specialNeedsNote = String(body.specialNeedsNote || '').trim().slice(0, 400);
      const useWebGrounding = body.useWebGrounding !== false;

      const ai = getGeminiClient();
      const prompt = [
        `Generate a complete, ready-to-teach Rwanda Competence-Based Curriculum (CBC / REB) Lesson Plan for EP Saint Pierre Nkombo (Nkombo Island, Rusizi District).`,
        ``,
        `SCHOOL TRAINED PEDAGOGY & LESSON STYLE RULES (ALWAYS APPLY THESE):`,
        trainerNotes ||
          `- Include Nkombo Island / Lake Kivu local contextual examples where natural.\n- Emphasize cooperative pair/group discovery, multilingual vocabulary reinforcement (Kinyarwanda/English/French), and formative check questions.\n- Include clear teacher activities, learner activities, generic competences, and cross-cutting issues per REB template.`,
        ``,
        `LESSON SPECIFICATIONS:`,
        `- Subject: ${subject}`,
        `- Class / Grade: ${gradeLevel}`,
        `- Unit / Lesson Topic: ${topic}`,
        `- Duration: ${duration} minutes`,
        `- Class Size: ${classSize} pupils`,
        `- Output Language: ${language}`,
        specialNeedsNote ? `- Inclusion / Differentiation Note: ${specialNeedsNote}` : '',
        ``,
        `REQUIRED REB LESSON PLAN STRUCTURE (Use clear Markdown headings):`,
        `1. Lesson Header (School: EP Saint Pierre Nkombo, Term, Subject, Grade, Topic, Duration, Class Size)`,
        `2. Key Unit Competence & Specific Instructional Objectives (Knowledge & Understanding, Skills, Attitudes & Values)`,
        `3. Generic Competences & Cross-Cutting Issues`,
        `4. Teaching & Learning Materials (Low-cost local Nkombo & REB textbook references)`,
        `5. Lesson Steps Breakdown (Introduction, Development / Discovery Activity, Practice, Conclusion & Assessment) with timing, Teacher Activity, and Learner Activity`,
        `6. Formative Assessment Questions & Answers (3–5 short checks)`,
        `7. Homework / Parent Engagement Task`,
      ]
        .filter(Boolean)
        .join('\n');

      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: prompt,
        config: useWebGrounding ? { tools: [{ googleSearch: {} }] } : undefined,
      });

      const lessonPlan = response.text || 'Unable to generate lesson plan.';
      const sources = useWebGrounding ? extractGroundingLinks(response) : [];

      res.json({
        lessonPlan,
        sources,
      });
    } catch (err) {
      console.error('AI Lesson Plan error:', err);
      const message =
        err instanceof Error ? err.message : 'Unable to generate lesson plan right now.';
      res.status(500).json({ error: message });
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
      const indexHtml = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EP Saint Pierre Nkombo server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
