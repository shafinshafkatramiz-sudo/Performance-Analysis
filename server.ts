import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenAI({ apiKey: key });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  app.post("/api/map-indicators", async (req, res) => {
    try {
      const { indicators, targets } = req.body;
      const ai = getGeminiClient();
      
      const prompt = `
      You are a specialized data mapping system for a microfinance dashboard.
      Your task is to accurately map a list of desired TARGET metric names to the exact equivalent strings from a list of user INDICATORS extracted from an Excel file.
      Perform very smart semantic matching. For example: "Total OD Amount" maps to "Amount of Total OD", "PAR 30" maps to "PAR>30", "Amount of Loan Disbursed" matches "Amount of New Loan Disbursed" if it's the closest, and "Amount of Loan Disbursed (Cumulative)" matches "Total Amount Disbursed" or "Cumulative Disbursed", etc.
      
      TARGET METRICS:
      ${JSON.stringify(targets)}
      
      AVAILABLE EXCEL INDICATORS:
      ${JSON.stringify(indicators)}

      Please return ONLY a valid JSON object where the keys are the TARGET METRICS and values are the exact matching EXCEL INDICATOR string.
      Only map targets that have a reasonable match.
      `;

      let response;
      let retries = 3;
      let delay = 1000;
      
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            }
          });
          break; // success
        } catch (err: any) {
          if (err.status === 503 || err.status === 429) {
            retries--;
            if (retries === 0) throw err;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2;
          } else {
            throw err;
          }
        }
      }
      
      const jsonText = response?.text || "{}";
      const mapping = JSON.parse(jsonText);
      res.json({ mapping });
    } catch (error: any) {
       // Model unavailable or error, return empty mapping successfully to allow fallback to heuristic without breaking UX
       res.status(200).json({ mapping: {} });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Support Express v5 catch-all syntax natively by using express.static fallback properly
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
