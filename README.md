# 💸 SplitFair — Elegant Bill Splitting & Expense Tracker

SplitFair is a highly polished, modern full-stack web application designed to simplify splitting group expenses, tracking obligations, and settling balances with ease. Tailored with beautiful Swiss-minimalist typography, local Vietnamese Dong (₫) optimizations, and powered by Gemini AI, it makes group finances delightful.

![SplitFair Web Application UI Screenshot](src/assets/images/splitfair_ui_screenshot_1783497119868.jpg)

---

## ✨ Features

*   **🇻🇳 Vietnamese Dong (₫) Optimization**: Completely optimized for realistic VND currency formatting, inputs, preset mock menu items, and division logic without decimals.
*   **🤖 AI Receipt & Bill Parser**: Powered by **Gemini 3.5 Flash**, users can input free-form receipt text or chat descriptions, and the AI will automatically parse the description, amount, category, payer(s), and division splits.
*   **📲 MoMo Payment Integration**: Generates QR codes on-the-fly for seamless peer-to-peer settling using standard MoMo deep links. Supports custom payment amounts and phone number configurations.
*   **🍽️ Itemized & Party Split Modes**:
    *   **Equal Splits**: Split evenly among all members.
    *   **Unequal / Percentage / Shares**: Manually allocate exact figures or ratios.
    *   **Party Mode / Individual Plates**: Match members to specific items they consumed, and automatically split tax/tips equally.
*   **💾 Hybrid Database Persistence**: Features a high-performance Prisma client that writes to a PostgreSQL database if configured, or gracefully falls back to an active in-memory storage engine.

---

## 🛠️ Tech Stack

*   **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion (for smooth layout transitions and modal entrances).
*   **Backend**: Node.js, Express, tsx, esbuild.
*   **Database**: Prisma ORM, PostgreSQL (optional, falls back to memory).
*   **Artificial Intelligence**: Google GenAI SDK (`@google/genai`), Gemini 3.5 Flash.

---

## 🚀 Getting Started

Follow these instructions to set up and run SplitFair on your local development system.

### 1. Prerequisites

Ensure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18.x or higher)
*   [npm](https://www.npmjs.com/) (bundled with Node.js)

### 2. Installation

Clone or download the project files into your working workspace directory and install all required npm dependencies:

```bash
# Install core dependencies
npm install
```

### 3. Environment Setup

Configure your environment variables by copying the example environment template:

```bash
cp .env.example .env
```

Open `.env` and fill in the required keys:

```env
# Google Gemini API Secret Key (Required for the AI parsing features)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: PostgreSQL Connection URI
# If left blank/commented, the application will automatically operate in in-memory mode
DATABASE_URL=postgresql://user:password@host:port/dbname?schema=public
```

### 4. Running the Development Server

Start the full-stack development server (using `tsx` for backend TypeScript hot-reloading and Vite for the React frontend asset pipeline on port `3000`):

```bash
npm run dev
```

The application is now accessible at `http://localhost:3000` (or `http://0.0.0.0:3000` in container sandboxes).

### 5. Building and Running in Production

To build the application for optimized production hosting:

```bash
# 1. Compile the React frontend and bundle the backend TypeScript server
npm run build

# 2. Launch the self-contained production environment
npm run start
```

---

## 🗄️ Database Management with Prisma

If you are using a PostgreSQL database, you can run Prisma schema migrations and generate clients with the following commands:

```bash
# Generate the Prisma Client
npm run prisma:generate

# Push schema changes directly to your database (for prototyping)
npx prisma db push
```

---

## 📐 Project Structure

```text
├── prisma/               # Prisma Database Schemas
├── src/
│   ├── assets/           # Statics & generated UI screenshots
│   ├── components/       # UI & Module components
│   │   ├── AiAssistant.tsx   # AI receipt assistant sidebar
│   │   ├── Dashboard.tsx     # Recharts visual analytics and cards
│   │   ├── DebtSettle.tsx    # Settle balance and MoMo QR triggers
│   │   ├── ExpenseForm.tsx   # Highly versatile multi-mode expense creator
│   │   ├── ExpenseList.tsx   # Collapsible breakdown lists for receipts
│   │   ├── GroupList.tsx     # Simple Group selectors
│   │   └── MenuManager.tsx   # Shared menu manager for presets
│   ├── lib/              # Client utility helper functions
│   ├── types.ts          # Strongly-typed interface definitions
│   ├── App.tsx           # Primary React entry routing wrapper
│   └── main.tsx          # React client mounter
├── server.ts             # Express and Vite full-stack middleware server
└── package.json          # Node scripts, dependencies and system parameters
```
