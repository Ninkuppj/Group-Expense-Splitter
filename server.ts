import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini AI client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please add it via the Secrets panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API endpoint to parse free-form expenses using Gemini AI
app.post("/api/parse-expense", async (req, res) => {
  try {
    const { prompt, members } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: "A valid 'prompt' string is required." });
    }
    
    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ error: "The 'members' array is required to match names to active member IDs." });
    }

    const ai = getGeminiClient();

    const membersListText = members.map(m => `- ID: "${m.id}", Name: "${m.name}"`).join("\n");

    const systemInstruction = `You are an expert financial assistant and expense-splitting parser.
Your task is to analyze a natural language description of an expense and extract structured splitting details.
You must map names mentioned in the text strictly to the member IDs provided in the context below.

### Member List Context (ID and Name mapping):
${membersListText}

### Parsing Rules:
1. **Description**: Create a concise, human-friendly title (e.g., "Dinner at Italian Bistro", "Uber Ride", "Airbnb Lodging").
2. **Amount**: Extract the total amount of the expense as a floating-point number.
3. **Category**: Choose the single most appropriate category from: "Food", "Travel", "Lodging", "Entertainment", "Utilities", "Other".
4. **Payers**: Map the person or people who paid. Value must be a key-value object of { [memberId]: amount }. The sum of values must exactly match the total expense amount.
   - If the text specifies multiple payers (e.g., "John paid $40, Alice paid $60"), allocate accordingly.
   - If it says "John paid", map 100% of the amount to John's ID.
   - If no payer is mentioned, default to assigning 100% to the first member's ID in the list.
5. **SplitType**: Decide the split method. Must be one of: "equal", "unequal", "percentage", "shares".
   - "equal": Default. Everyone splits it evenly.
   - "unequal": Exact different dollar amounts are specified for participants.
   - "percentage": Percentage shares are specified (must sum to 100).
   - "shares": Ratios are specified (e.g. 2 shares, 1 share).
6. **Splits**: An object containing { [memberId]: value } representing how the cost is split.
   - For "equal": Set the value of each participant member ID to 1.
   - For "unequal": Set the value to the exact amount each person owes. The sum of all splits MUST equal the total expense amount.
   - For "percentage": Set the value to the percentage (e.g., 50, 30, 20). Must sum up to 100.
   - For "shares": Set the value to the share ratio (e.g., 2, 1).
   - If a member is NOT participating in the expense, do NOT include their ID in the splits object or set it to 0.

Maintain strict mathematical consistency (e.g. if amount is 120 and John paid, payers should be { JohnId: 120 }. If John and Alice split equally, splits should be { JohnId: 1, AliceId: 1 }).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Parse this expense description: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "Concise name of the expense"
            },
            amount: {
              type: Type.NUMBER,
              description: "Total cost of the expense"
            },
            category: {
              type: Type.STRING,
              description: "Category: Food, Travel, Lodging, Entertainment, Utilities, or Other"
            },
            payers: {
              type: Type.OBJECT,
              description: "Map of member ID keys to number values representing the exact amount they contributed. Sum must equal total amount."
            },
            splitType: {
              type: Type.STRING,
              description: "Method of split: equal, unequal, percentage, or shares"
            },
            splits: {
              type: Type.OBJECT,
              description: "Map of member ID keys to split values (1 for equal, actual amount for unequal, percentage (0-100) for percentage, relative share count for shares)."
            }
          },
          required: ["description", "amount", "category", "payers", "splitType", "splits"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI parsing model.");
    }

    const parsedData = JSON.parse(text.trim());
    return res.json(parsedData);
  } catch (err: any) {
    console.error("AI Parse Error:", err);
    return res.status(500).json({ 
      error: "Failed to parse expense using AI.", 
      details: err.message || String(err) 
    });
  }
});

// Configure Vite or Static Assets serving
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server mounted as middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files server mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Group Expense Splitter server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic();
