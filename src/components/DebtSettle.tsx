import { useState } from 'react';
import { Check, ArrowRight, Wallet, ArrowDownRight, ArrowUpRight, Users } from 'lucide-react';
import { Member, Expense, MemberBalance, DebtTransaction } from '../types';
import { calculateBalances, calculateDebtSettlement } from '../utils/settle';

interface DebtSettleProps {
  members: Member[];
  expenses: Expense[];
  onRecordSettlement: (settlementExpense: Expense) => void;
}

export default function DebtSettle({ members, expenses, onRecordSettlement }: DebtSettleProps) {
  const balances = calculateBalances(members, expenses);
  const settlements = calculateDebtSettlement(members, expenses);

  const [myPerspectiveMemberId, setMyPerspectiveMemberId] = useState(members[0]?.id || '');
  const activePerspectiveMember = members.find(m => m.id === myPerspectiveMemberId);
  
  // Calculate specific debts for this member
  const myDebtsToOthers = settlements.filter(t => t.fromId === myPerspectiveMemberId);
  const myDebtsFromOthers = settlements.filter(t => t.toId === myPerspectiveMemberId);
  const totalIOwe = myDebtsToOthers.reduce((sum, t) => sum + t.amount, 0);
  const totalOwedToMe = myDebtsFromOthers.reduce((sum, t) => sum + t.amount, 0);

  const handleSettleClick = (trans: DebtTransaction) => {
    // Generate a settlement system expense
    const settlementExpense: Expense = {
      id: crypto.randomUUID(),
      description: `Settlement: ${trans.fromName} ➜ ${trans.toName}`,
      amount: trans.amount,
      date: new Date().toISOString().split('T')[0],
      category: 'Other',
      note: 'Automatic balance settlement',
      // The person who owed the money is the payer of the settlement
      payers: { [trans.fromId]: trans.amount },
      splitType: 'unequal',
      // The person who received it gets it allocated as their split (meaning they owed it for the settlement)
      splits: { [trans.toId]: trans.amount }
    };

    onRecordSettlement(settlementExpense);
  };

  return (
    <div className="space-y-8" id="debt-settle-view">
      {/* Interactive Personal Perspective Card */}
      <div className="bg-[#1A1A1A] text-white rounded-xs border border-transparent p-6 md:p-8 shadow-lg font-sans" id="my-debts-perspective-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-6">
          <div>
            <span className="text-[10px] font-bold text-[#D2C9B9] uppercase tracking-[0.25em] block mb-1">My Personal Perspective</span>
            <h3 className="font-serif italic text-2xl text-white">Whom do I owe, and how much?</h3>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Select member:</span>
            <select
              value={myPerspectiveMemberId}
              onChange={(e) => setMyPerspectiveMemberId(e.target.value)}
              className="bg-[#2A2A2A] border border-white/10 rounded-xs px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#D2C9B9]"
              id="perspective-selector"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {activePerspectiveMember && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* IOwe Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-[#D2C9B9] uppercase tracking-[0.2em] border-b border-white/5 pb-2">
                Who does {activePerspectiveMember.name} owe?
              </h4>
              
              {myDebtsToOthers.length === 0 ? (
                <div className="py-4 text-white/40 italic text-xs">
                  You don't owe anyone anything! All clear.
                </div>
              ) : (
                <div className="space-y-3">
                  {myDebtsToOthers.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-baseline py-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-white/40">You owe</span>
                        <span className="font-bold text-white text-sm">{t.toName}</span>
                      </div>
                      <span className="font-serif italic text-lg font-bold text-rose-400">${t.amount.toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total obligations to pay:</span>
                    <span className="font-serif italic text-2xl font-bold text-rose-400">${totalIOwe.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* OthersOweMe Section */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-[#D2C9B9] uppercase tracking-[0.2em] border-b border-white/5 pb-2">
                Who owes {activePerspectiveMember.name}?
              </h4>

              {myDebtsFromOthers.length === 0 ? (
                <div className="py-4 text-white/40 italic text-xs">
                  Nobody owes you anything right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {myDebtsFromOthers.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-baseline py-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-white text-sm">{t.fromName}</span>
                        <span className="text-white/40">owes you</span>
                      </div>
                      <span className="font-serif italic text-lg font-bold text-[#D2C9B9]">${t.amount.toFixed(2)}</span>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total you are owed:</span>
                    <span className="font-serif italic text-2xl font-bold text-[#D2C9B9]">${totalOwedToMe.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 1. Balances List Card */}
      <div className="bg-white rounded-xs border border-black/5 p-6 md:p-8 shadow-sm">
        <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mb-4 pb-2 border-b border-black/5 flex items-center gap-2">
          <Wallet className="w-3.5 h-3.5 text-black/40" />
          Member Balances
        </h3>

        <div className="divide-y divide-black/5 max-h-72 overflow-y-auto pr-1">
          {balances.map(bal => {
            const isSettled = Math.abs(bal.netBalance) < 0.01;
            const isOwed = bal.netBalance < 0; // Negative means they owe
            const isOwedTo = bal.netBalance > 0; // Positive means they are owed

            return (
              <div key={bal.memberId} className="py-3.5 flex items-center justify-between gap-4 font-sans" id={`balance-row-${bal.memberId}`}>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-xs text-[#1A1A1A]">{bal.memberName}</span>
                  {isSettled ? (
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-[#F4F2EE] text-black/60 border border-black/10 px-2 py-0.5 rounded-xs">Settled</span>
                  ) : isOwed ? (
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 rounded-xs inline-flex items-center gap-0.5">
                      <ArrowDownRight className="w-2.5 h-2.5" />
                      Owes
                    </span>
                  ) : (
                    <span className="text-[9px] uppercase tracking-wider font-bold bg-stone-100 text-[#1A1A1A] border border-black/10 px-2 py-0.5 rounded-xs inline-flex items-center gap-0.5">
                      <ArrowUpRight className="w-2.5 h-2.5" />
                      Is Owed
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="text-[10px] text-black/40 uppercase tracking-wider font-bold hidden sm:block">
                    <span>Paid: ${bal.paidAmount.toFixed(2)}</span>
                    <span className="mx-2">•</span>
                    <span>Owed: ${bal.owedAmount.toFixed(2)}</span>
                  </div>
                  <span className={`font-serif italic text-base ${isSettled ? 'text-black/40' : isOwedTo ? 'text-[#1A1A1A] font-bold' : 'text-rose-700'}`}>
                    {isOwedTo ? '+' : ''}${bal.netBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Settle Up Suggestions Card */}
      <div className="bg-white rounded-xs border border-black/5 p-6 md:p-8 shadow-sm">
        <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mb-4 pb-2 border-b border-black/5">
          Recommended Transfers ({settlements.length})
        </h3>

        {settlements.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-black/10 rounded-xs bg-[#F4F2EE]/40" id="settlements-all-cleared">
            <Check className="w-6 h-6 text-[#1A1A1A] mx-auto mb-3 border border-black/10 bg-white p-1 rounded-full" />
            <p className="font-sans font-bold text-xs uppercase tracking-wider text-black/60">All balances are settled!</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            <p className="text-[10px] text-black/40 font-sans tracking-wide leading-relaxed mb-1">
              Optimized transfer chain calculated with minimal transaction costs. Record payment completion:
            </p>
            {settlements.map((trans, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F4F2EE]/40 hover:bg-[#F4F2EE]/60 border border-black/5 p-4 rounded-xs transition-all"
                id={`settle-row-${idx}`}
              >
                <div className="flex items-center gap-2 text-xs font-sans text-black/70 font-medium flex-wrap">
                  <span className="font-bold text-[#1A1A1A]">{trans.fromName}</span>
                  <span className="text-black/40">pays</span>
                  <span className="font-bold text-[#1A1A1A]">{trans.toName}</span>
                  <span className="text-black/40">amounting to</span>
                  <span className="font-serif italic text-sm text-[#1A1A1A] bg-white border border-black/10 px-2.5 py-0.5 rounded-xs shadow-2xs">${trans.amount.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => handleSettleClick(trans)}
                  className="shrink-0 self-end sm:self-center bg-black hover:bg-black/95 text-white text-[9px] uppercase tracking-widest font-bold px-4 py-2 rounded-xs transition-all"
                  id={`settle-btn-${idx}`}
                >
                  Settle Up
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Personal Ledger Summary (Who Owes Whom) */}
      <div className="bg-white rounded-xs border border-black/5 p-6 md:p-8 shadow-sm" id="personal-ledgers-card">
        <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mb-4 pb-2 border-b border-black/5 flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-black/40" />
          Who Owes Whom Summary
        </h3>
        
        <p className="text-[10px] text-black/40 font-sans tracking-wide leading-relaxed mb-6">
          Individual ledger sheets showing exactly who owes whom and the total net amounts based on other people's bills and history of logs:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map(member => {
            const debtsToOthers = settlements.filter(t => t.fromId === member.id);
            const debtsFromOthers = settlements.filter(t => t.toId === member.id);
            const totalOwedToOthers = debtsToOthers.reduce((sum, t) => sum + t.amount, 0);
            const totalOwedFromOthers = debtsFromOthers.reduce((sum, t) => sum + t.amount, 0);

            return (
              <div 
                key={member.id} 
                className="bg-[#F4F2EE]/30 border border-black/5 rounded-xs p-5 flex flex-col justify-between hover:border-black/15 transition-all"
                id={`member-ledger-${member.id}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-black/[0.03] pb-2">
                    <span className="font-bold text-sm text-[#1A1A1A]">{member.name}'s Ledger</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-black/40">
                      {totalOwedToOthers > 0 ? `Net Debtor` : totalOwedFromOthers > 0 ? 'Net Creditor' : 'Fully Settled'}
                    </span>
                  </div>

                  {/* Debts to others ("Who do I owe?") */}
                  <div className="space-y-2.5 mb-4">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-black/40">Who does {member.name} owe?</p>
                    {debtsToOthers.length === 0 ? (
                      <p className="text-xs text-black/40 italic pl-1">Does not owe anyone anything.</p>
                    ) : (
                      <div className="space-y-1.5 pl-1">
                        {debtsToOthers.map((t, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-black/50">Owes</span>
                              <span className="font-bold text-[#1A1A1A]">{t.toName}</span>
                            </div>
                            <span className="font-serif italic font-bold text-rose-700">${t.amount.toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-1.5 border-t border-black/5 text-[10px] font-bold text-black/50 uppercase tracking-wide">
                          <span>Total Owed</span>
                          <span className="text-rose-700">${totalOwedToOthers.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Debts from others ("Who owes me?") */}
                  <div className="space-y-2.5">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-black/40">Who owes {member.name}?</p>
                    {debtsFromOthers.length === 0 ? (
                      <p className="text-xs text-black/40 italic pl-1">No one owes them money.</p>
                    ) : (
                      <div className="space-y-1.5 pl-1">
                        {debtsFromOthers.map((t, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-[#1A1A1A]">{t.fromName}</span>
                              <span className="text-black/50">owes them</span>
                            </div>
                            <span className="font-serif italic font-bold text-black">${t.amount.toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-1.5 border-t border-black/5 text-[10px] font-bold text-black/50 uppercase tracking-wide">
                          <span>Total to Receive</span>
                          <span className="text-black">${totalOwedFromOthers.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
