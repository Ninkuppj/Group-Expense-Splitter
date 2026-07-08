import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { prisma } from "./src/lib/prisma";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Default fallback data to seed the database if it is empty
const DEFAULT_SEED_GROUPS = [
  {
    id: 'g1',
    name: 'Ski Cabin 2026',
    description: 'Annual snowboarding trip to Tahoe with roommates',
    members: [
      { id: 'm1', name: 'John Doe', phone: '0901234567', avatarColor: 'bg-emerald-500 text-white' },
      { id: 'm2', name: 'Alice Smith', phone: '0912345678', avatarColor: 'bg-blue-500 text-white' },
      { id: 'm3', name: 'Bob Jones', phone: '0923456789', avatarColor: 'bg-indigo-500 text-white' },
      { id: 'm4', name: 'Clara White', phone: '0934567890', avatarColor: 'bg-rose-500 text-white' },
    ],
    expenses: [
      {
        id: 'e1',
        description: 'Cabin Chalet Lodging',
        amount: 1200,
        date: '2026-07-02',
        category: 'Lodging',
        note: 'Tahoe wood cabin deposit',
        payers: { 'm1': 1200 },
        splitType: 'equal',
        splits: { 'm1': 1, 'm2': 1, 'm3': 1, 'm4': 1 }
      },
      {
        id: 'e2',
        description: 'Ski Lodge Dinner',
        amount: 240,
        date: '2026-07-03',
        category: 'Food',
        note: 'Tacos & drinks at base camp',
        payers: { 'm2': 180, 'm3': 60 },
        splitType: 'percentage',
        splits: { 'm1': 25, 'm2': 25, 'm3': 25, 'm4': 25 }
      },
      {
        id: 'e3',
        description: 'Groceries & Supplies',
        amount: 140,
        date: '2026-07-04',
        category: 'Food',
        note: 'Target snack run',
        payers: { 'm3': 140 },
        splitType: 'unequal',
        splits: { 'm1': 40, 'm2': 40, 'm3': 20, 'm4': 40 }
      }
    ]
  },
  {
    id: 'g2',
    name: 'Apartment 4B',
    description: 'Monthly utility and rent splitting',
    members: [
      { id: 'm5', name: 'Emma Watson', phone: '0987654321', avatarColor: 'bg-violet-500 text-white' },
      { id: 'm6', name: 'Liam Neeson', phone: '0976543210', avatarColor: 'bg-amber-500 text-white' },
    ],
    expenses: [
      {
        id: 'e4',
        description: 'Wifi Internet Bill',
        amount: 80,
        date: '2026-07-01',
        category: 'Utilities',
        payers: { 'm5': 80 },
        splitType: 'equal',
        splits: { 'm5': 1, 'm6': 1 }
      }
    ]
  }
];

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

// Dynamic in-memory store for fallback mode when database is offline or not configured
let memoryGroups = JSON.parse(JSON.stringify(DEFAULT_SEED_GROUPS)).map((sg: any) => ({
  id: sg.id,
  name: sg.name,
  description: sg.description,
  createdAt: new Date().toISOString().split("T")[0],
  members: sg.members,
  expenses: sg.expenses,
  customMenu: []
}));

let usePrisma = !!process.env.DATABASE_URL;
if (!usePrisma) {
  console.warn("DATABASE_URL environment variable is missing. Operating in-memory fallback mode.");
}

// Database API Routes
app.get("/api/groups", async (req, res) => {
  if (usePrisma) {
    try {
      let dbGroups = await prisma.group.findMany({
        include: {
          members: true,
          expenses: {
            orderBy: { date: "desc" }
          },
          customMenu: true
        },
        orderBy: { createdAt: "desc" }
      });

      // Seed database if completely empty
      if (dbGroups.length === 0) {
        console.log("No groups found in PostgreSQL. Seeding initial data...");
        for (const sg of DEFAULT_SEED_GROUPS) {
          await prisma.group.create({
            data: {
              id: sg.id,
              name: sg.name,
              description: sg.description,
              createdAt: new Date(),
              members: {
                createMany: {
                  data: sg.members.map(m => ({
                    id: m.id,
                    name: m.name,
                    phone: m.phone || null,
                    avatarColor: m.avatarColor || null
                  }))
                }
              },
              expenses: {
                createMany: {
                  data: sg.expenses.map(e => ({
                    id: e.id,
                    description: e.description,
                    amount: e.amount,
                    date: new Date(e.date),
                    category: e.category,
                    note: e.note || null,
                    payers: e.payers,
                    splitType: e.splitType,
                    splits: e.splits,
                  }))
                }
              }
            }
          });
        }

        // Re-query seeded groups
        dbGroups = await prisma.group.findMany({
          include: {
            members: true,
            expenses: {
              orderBy: { date: "desc" }
            },
            customMenu: true
          },
          orderBy: { createdAt: "desc" }
        });
      }

      // Format fields for frontend compatibility
      const formattedGroups = dbGroups.map(g => ({
        id: g.id,
        name: g.name,
        description: g.description,
        createdAt: g.createdAt.toISOString().split("T")[0],
        members: g.members,
        customMenu: g.customMenu || [],
        expenses: g.expenses.map(e => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          date: e.date.toISOString().split("T")[0],
          category: e.category,
          note: e.note || undefined,
          billImage: e.billImage || undefined,
          payers: e.payers as any,
          splitType: e.splitType as any,
          splits: e.splits as any,
          billType: e.billType as any,
          menuItems: e.menuItems as any,
          partyItems: e.partyItems as any
        }))
      }));

      // Keep memory in sync as backup
      memoryGroups = JSON.parse(JSON.stringify(formattedGroups));

      return res.json(formattedGroups);
    } catch (error: any) {
      console.warn("Database connection/query failed. Falling back to in-memory mode.", error.message);
      usePrisma = false;
    }
  }

  // Fallback to in-memory store
  return res.json(memoryGroups);
});

app.post("/api/groups", async (req, res) => {
  const { name, description, initialMembers } = req.body;

  if (usePrisma) {
    try {
      const group = await prisma.group.create({
        data: {
          name,
          description,
          members: {
            create: [
              {
                name: "You (Me)",
                avatarColor: "bg-slate-900 text-white"
              },
              ...(initialMembers || []).map((m: any) => ({
                name: m.name,
                phone: m.phone || null,
                avatarColor: m.avatarColor || "bg-rose-500 text-white"
              }))
            ]
          }
        },
        include: {
          members: true,
          expenses: true,
          customMenu: true
        }
      });
      
      const formattedGroup = {
        id: group.id,
        name: group.name,
        description: group.description,
        createdAt: group.createdAt.toISOString().split("T")[0],
        members: group.members,
        expenses: [],
        customMenu: []
      };
      memoryGroups.unshift(formattedGroup);

      return res.json(group);
    } catch (err: any) {
      console.warn("POST /api/groups failed on DB. Falling back to in-memory store.", err.message);
      usePrisma = false;
    }
  }

  const newGroup = {
    id: 'g_' + Math.random().toString(36).substring(2, 9),
    name,
    description,
    createdAt: new Date().toISOString().split('T')[0],
    members: [
      {
        id: 'm_me',
        name: "You (Me)",
        phone: null,
        avatarColor: "bg-slate-900 text-white"
      },
      ...(initialMembers || []).map((m: any) => ({
        id: 'm_' + Math.random().toString(36).substring(2, 9),
        name: m.name,
        phone: m.phone || null,
        avatarColor: m.avatarColor || "bg-rose-500 text-white"
      }))
    ],
    expenses: [],
    customMenu: []
  };
  memoryGroups.unshift(newGroup);
  return res.json(newGroup);
});

app.delete("/api/groups/:id", async (req, res) => {
  const { id } = req.params;

  if (usePrisma) {
    try {
      await prisma.group.delete({ where: { id } });
      memoryGroups = memoryGroups.filter(g => g.id !== id);
      return res.json({ success: true });
    } catch (err: any) {
      console.warn(`DELETE /api/groups/${id} failed on DB. Falling back to in-memory store.`, err.message);
      usePrisma = false;
    }
  }

  memoryGroups = memoryGroups.filter(g => g.id !== id);
  return res.json({ success: true });
});

app.post("/api/groups/:id/members", async (req, res) => {
  const { id: groupId } = req.params;
  const { name, phone, avatarColor } = req.body;

  if (usePrisma) {
    try {
      const member = await prisma.member.create({
        data: {
          name,
          phone: phone || null,
          avatarColor,
          groupId
        }
      });

      const group = memoryGroups.find(g => g.id === groupId);
      if (group) {
        group.members.push(member);
      }

      return res.json(member);
    } catch (err: any) {
      console.warn(`POST /api/groups/${groupId}/members failed on DB. Falling back to in-memory store.`, err.message);
      usePrisma = false;
    }
  }

  const group = memoryGroups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  const member = {
    id: 'm_' + Math.random().toString(36).substring(2, 9),
    name,
    phone: phone || null,
    avatarColor,
    groupId
  };
  group.members.push(member);
  return res.json(member);
});

app.put("/api/members/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, avatarColor } = req.body;

  if (usePrisma) {
    try {
      const member = await prisma.member.update({
        where: { id },
        data: {
          name,
          phone: phone !== undefined ? phone : undefined,
          avatarColor: avatarColor !== undefined ? avatarColor : undefined,
        }
      });

      // Sync memoryGroups
      for (const group of memoryGroups) {
        const mIdx = group.members.findIndex(m => m.id === id);
        if (mIdx !== -1) {
          group.members[mIdx] = { ...group.members[mIdx], ...member };
          break;
        }
      }

      return res.json(member);
    } catch (err: any) {
      console.warn(`PUT /api/members/${id} failed on DB. Falling back to in-memory store.`, err.message);
      usePrisma = false;
    }
  }

  // Fallback to in-memory store
  let foundMember = null;
  for (const group of memoryGroups) {
    const mIdx = group.members.findIndex(m => m.id === id);
    if (mIdx !== -1) {
      if (name !== undefined) group.members[mIdx].name = name;
      if (phone !== undefined) group.members[mIdx].phone = phone;
      if (avatarColor !== undefined) group.members[mIdx].avatarColor = avatarColor;
      foundMember = group.members[mIdx];
      break;
    }
  }

  if (foundMember) {
    return res.json(foundMember);
  }
  return res.status(404).json({ error: "Member not found" });
});

app.post("/api/groups/:id/expenses", async (req, res) => {
  const { id: groupId } = req.params;
  const { id, description, amount, date, category, note, billImage, payers, splitType, splits, billType, menuItems, partyItems } = req.body;

  if (usePrisma) {
    try {
      let expense;
      if (id) {
        const existing = await prisma.expense.findFirst({ where: { id } });
        if (existing) {
          expense = await prisma.expense.update({
            where: { id },
            data: {
              description,
              amount: parseFloat(amount),
              date: new Date(date),
              category,
              note: note || null,
              billImage: billImage || null,
              payers: payers || {},
              splitType,
              splits: splits || {},
              billType: billType || null,
              menuItems: menuItems || null,
              partyItems: partyItems || null
            }
          });
        }
      }

      if (!expense) {
        expense = await prisma.expense.create({
          data: {
            id: id || undefined,
            description,
            amount: parseFloat(amount),
            date: new Date(date),
            category,
            note: note || null,
            billImage: billImage || null,
            payers: payers || {},
            splitType,
            splits: splits || {},
            billType: billType || null,
            menuItems: menuItems || null,
            partyItems: partyItems || null,
            groupId
          }
        });
      }

      const group = memoryGroups.find(g => g.id === groupId);
      if (group) {
        const formatted = {
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          date: expense.date instanceof Date ? expense.date.toISOString().split('T')[0] : String(expense.date).split('T')[0],
          category: expense.category,
          note: expense.note,
          billImage: expense.billImage,
          payers: expense.payers,
          splitType: expense.splitType,
          splits: expense.splits,
          billType: expense.billType,
          menuItems: expense.menuItems,
          partyItems: expense.partyItems
        };
        const idx = group.expenses.findIndex(e => e.id === formatted.id);
        if (idx !== -1) {
          group.expenses[idx] = formatted;
        } else {
          group.expenses.unshift(formatted);
        }
      }

      return res.json(expense);
    } catch (err: any) {
      console.warn(`POST /api/groups/${groupId}/expenses failed on DB. Falling back to in-memory store.`, err.message);
      usePrisma = false;
    }
  }

  const group = memoryGroups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  let expense: any;
  if (id) {
    expense = group.expenses.find(e => e.id === id);
    if (expense) {
      expense.description = description;
      expense.amount = parseFloat(amount);
      expense.date = date;
      expense.category = category;
      expense.note = note || null;
      expense.billImage = billImage || null;
      expense.payers = payers || {};
      expense.splitType = splitType;
      expense.splits = splits || {};
      expense.billType = billType || null;
      expense.menuItems = menuItems || null;
      expense.partyItems = partyItems || null;
    }
  }

  if (!expense) {
    expense = {
      id: id || 'e_' + Math.random().toString(36).substring(2, 9),
      description,
      amount: parseFloat(amount),
      date: date,
      category,
      note: note || null,
      billImage: billImage || null,
      payers: payers || {},
      splitType,
      splits: splits || {},
      billType: billType || null,
      menuItems: menuItems || null,
      partyItems: partyItems || null
    };
    group.expenses.unshift(expense);
  }

  return res.json(expense);
});

app.delete("/api/expenses/:id", async (req, res) => {
  const { id } = req.params;

  if (usePrisma) {
    try {
      await prisma.expense.delete({ where: { id } });
      
      for (const group of memoryGroups) {
        const idx = group.expenses.findIndex(e => e.id === id);
        if (idx !== -1) {
          group.expenses.splice(idx, 1);
          break;
        }
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.warn(`DELETE /api/expenses/${id} failed on DB. Falling back to in-memory store.`, err.message);
      usePrisma = false;
    }
  }

  for (const group of memoryGroups) {
    const idx = group.expenses.findIndex(e => e.id === id);
    if (idx !== -1) {
      group.expenses.splice(idx, 1);
      break;
    }
  }
  return res.json({ success: true });
});

app.put("/api/groups/:id/menu", async (req, res) => {
  const { id: groupId } = req.params;
  const { menu } = req.body;

  if (usePrisma) {
    try {
      await prisma.menuItem.deleteMany({ where: { groupId } });

      if (menu && menu.length > 0) {
        await prisma.menuItem.createMany({
          data: menu.map((m: any) => ({
            name: m.name,
            price: parseFloat(m.price),
            category: m.category,
            groupId
          }))
        });
      }

      const updatedMenu = await prisma.menuItem.findMany({ where: { groupId } });
      
      const group = memoryGroups.find(g => g.id === groupId);
      if (group) {
        group.customMenu = updatedMenu.map(m => ({
          id: m.id,
          name: m.name,
          price: m.price,
          category: m.category,
          groupId: m.groupId
        }));
      }

      return res.json(updatedMenu);
    } catch (err: any) {
      console.warn(`PUT /api/groups/${groupId}/menu failed on DB. Falling back to in-memory store.`, err.message);
      usePrisma = false;
    }
  }

  const group = memoryGroups.find(g => g.id === groupId);
  if (!group) return res.status(404).json({ error: "Group not found" });

  group.customMenu = (menu || []).map((m: any) => ({
    id: m.id || 'menu_' + Math.random().toString(36).substring(2, 9),
    name: m.name,
    price: parseFloat(m.price),
    category: m.category,
    groupId
  }));

  return res.json(group.customMenu);
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
