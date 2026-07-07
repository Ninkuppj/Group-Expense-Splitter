import { useState } from 'react';
import { Sparkles, Loader2, AlertCircle, HelpCircle } from 'lucide-react';
import { Member, Expense } from '../types';

interface AiAssistantProps {
  members: Member[];
  onParsed: (parsedData: Partial<Expense>) => void;
}

export default function AiAssistant({ members, onParsed }: AiAssistantProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleParse = async () => {
    if (!inputText.trim()) {
      setError("Please write some text describing your receipt or expense.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/parse-expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: inputText,
          members: members.map(m => ({ id: m.id, name: m.name })),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || errData.details || 'Failed to parse expense');
      }

      const parsedExpense = await response.json();
      onParsed(parsedExpense);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred while processing with AI.');
    } finally {
      setLoading(false);
    }
  };

  const getExample = (type: number) => {
    switch (type) {
      case 1:
        return `Spent $120.50 on grocery supplies at Walmart. Alice paid. Split it equally between Alice, Bob and Charlie.`;
      case 2:
        return `Hotel booking at Marriott cost 350. Alice paid 200 and Bob paid 150. Split it 50% for Alice and 50% for Bob.`;
      case 3:
        return `Gas refills for $60. Charlie paid. Charlie owes 1 share, Bob owes 2 shares, Alice doesn't participate.`;
      default:
        return '';
    }
  };

  return (
    <div className="bg-[#F4F2EE] border border-black/10 rounded-xs p-6 mb-8" id="ai-assistant-card">
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="font-serif italic text-base text-[#1A1A1A] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
          Smart AI Ledger Parser
        </h3>
        <span className="text-[9px] uppercase tracking-wider font-bold bg-white text-black/60 border border-black/10 px-2.5 py-1 rounded-xs flex items-center gap-1.5 shadow-3xs">
          Powered by Gemini
        </span>
      </div>

      <p className="text-xs text-black/50 mb-4 font-sans leading-relaxed">
        Input plain text details of your invoice or receipt. The model will analyze the description, split logic, and payers, then automatically configure the ledger form below.
      </p>

      <div className="space-y-3.5">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="E.g., Dinner last night was $120. Sarah paid, split equally among everyone except Mike..."
          className="w-full h-24 bg-white border border-black/10 rounded-xs p-3.5 text-xs font-sans placeholder-black/30 focus:outline-none focus:border-black shadow-2xs"
          id="ai-prompt-input"
        />

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-[9px] font-sans text-black/40 font-bold uppercase tracking-widest mr-1">Try Preset:</span>
          <button
            onClick={() => setInputText(getExample(1))}
            className="text-[9px] uppercase tracking-wider font-bold text-black/60 bg-white hover:bg-[#F4F2EE] border border-black/10 px-3 py-1.5 rounded-xs transition-all"
            id="ai-example-1-btn"
          >
            Equal Split
          </button>
          <button
            onClick={() => setInputText(getExample(2))}
            className="text-[9px] uppercase tracking-wider font-bold text-black/60 bg-white hover:bg-[#F4F2EE] border border-black/10 px-3 py-1.5 rounded-xs transition-all"
            id="ai-example-2-btn"
          >
            Multi-Payer Percent
          </button>
          <button
            onClick={() => setInputText(getExample(3))}
            className="text-[9px] uppercase tracking-wider font-bold text-black/60 bg-white hover:bg-[#F4F2EE] border border-black/10 px-3 py-1.5 rounded-xs transition-all"
            id="ai-example-3-btn"
          >
            Shares Split
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 text-rose-800 text-xs p-4.5 rounded-xs font-sans" id="ai-error-banner">
            <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold uppercase tracking-wider text-[9px] text-rose-900 mb-0.5">Parsing Failed</p>
              <p className="text-rose-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 bg-[#F4F2EE] border border-black/10 text-[#1A1A1A] text-xs p-3.5 rounded-xs font-sans shadow-3xs" id="ai-success-banner">
            <Sparkles className="w-4 h-4 text-black/60 shrink-0 animate-pulse" />
            <p className="font-semibold text-black/70">Form populated successfully! Please review splits below.</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-[10px] font-sans text-black/40 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-black/30" />
            <span>AI parses description, category, payers, split-types & balances.</span>
          </div>

          <button
            onClick={handleParse}
            disabled={loading || !inputText.trim()}
            className="inline-flex items-center justify-center gap-2 bg-black hover:bg-black/90 text-white disabled:bg-black/10 disabled:text-black/30 text-[9px] uppercase tracking-[0.15em] font-bold px-4 py-2.5 rounded-xs transition-all focus:outline-none"
            id="ai-analyze-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-white/70" />
                Analyze Description
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
