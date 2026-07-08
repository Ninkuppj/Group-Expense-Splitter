import { useState } from 'react';
import { Check, ArrowRight, Wallet, ArrowDownRight, ArrowUpRight, Users, QrCode, Copy, ExternalLink, X } from 'lucide-react';
import { Member, Expense, MemberBalance, DebtTransaction } from '../types';
import { calculateBalances, calculateDebtSettlement } from '../utils/settle';

interface DebtSettleProps {
  members: Member[];
  expenses: Expense[];
  onRecordSettlement: (settlementExpense: Expense) => void;
  onUpdateMember: (memberId: string, name: string, phone?: string) => void;
}

export default function DebtSettle({ members, expenses, onRecordSettlement, onUpdateMember }: DebtSettleProps) {
  const balances = calculateBalances(members, expenses);
  const settlements = calculateDebtSettlement(members, expenses);

  const [myPerspectiveMemberId, setMyPerspectiveMemberId] = useState(members[0]?.id || '');
  const activePerspectiveMember = members.find(m => m.id === myPerspectiveMemberId);

  // MoMo Payment State
  const [activeMomoTrans, setActiveMomoTrans] = useState<DebtTransaction | null>(null);
  const [momoPhoneInput, setMomoPhoneInput] = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  
  // Custom MoMo amount override
  const [vndAmountOverride, setVndAmountOverride] = useState<string>('');
  
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

  const handleMoMoPayClick = (trans: DebtTransaction) => {
    setActiveMomoTrans(trans);
    const recipient = members.find(m => m.id === trans.toId);
    setMomoPhoneInput(recipient?.phone || '');
    setIsUpdatingPhone(!recipient?.phone);
    setVndAmountOverride('');
  };

  const handleSavePhone = async () => {
    if (!activeMomoTrans || !momoPhoneInput.trim()) return;
    const recipient = members.find(m => m.id === activeMomoTrans.toId);
    if (recipient) {
      await onUpdateMember(recipient.id, recipient.name, momoPhoneInput.trim());
      setIsUpdatingPhone(false);
    }
  };

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(momoPhoneInput);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <>
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
                      <span className="font-serif italic text-lg font-bold text-rose-400">{Math.round(t.amount).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total obligations to pay:</span>
                    <span className="font-serif italic text-2xl font-bold text-rose-400">{Math.round(totalIOwe).toLocaleString('vi-VN')} ₫</span>
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
                      <span className="font-serif italic text-lg font-bold text-[#D2C9B9]">{Math.round(t.amount).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  ))}

                  <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total you are owed:</span>
                    <span className="font-serif italic text-2xl font-bold text-[#D2C9B9]">{Math.round(totalOwedToMe).toLocaleString('vi-VN')} ₫</span>
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
                    <span>Paid: {Math.round(bal.paidAmount).toLocaleString('vi-VN')} ₫</span>
                    <span className="mx-2">•</span>
                    <span>Owed: {Math.round(bal.owedAmount).toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <span className={`font-serif italic text-base ${isSettled ? 'text-black/40' : isOwedTo ? 'text-[#1A1A1A] font-bold' : 'text-rose-700'}`}>
                    {isOwedTo ? '+' : ''}{Math.round(bal.netBalance).toLocaleString('vi-VN')} ₫
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
            {settlements.map((trans, idx) => {
              const recipient = members.find(m => m.id === trans.toId);
              const hasPhone = !!recipient?.phone;

              return (
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
                    <span className="font-serif italic text-sm text-[#1A1A1A] bg-white border border-black/10 px-2.5 py-0.5 rounded-xs shadow-2xs">{Math.round(trans.amount).toLocaleString('vi-VN')} ₫</span>
                    {hasPhone ? (
                      <span className="bg-[#A3E635]/20 text-[#3F6212] px-1.5 py-0.5 rounded-[2px] font-bold text-[8px] tracking-wider uppercase inline-flex items-center gap-0.5">
                        MoMo ready
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => handleMoMoPayClick(trans)}
                      className="inline-flex items-center gap-1.5 bg-[#A3E635]/20 hover:bg-[#A3E635]/35 text-[#3F6212] text-[9px] uppercase tracking-widest font-bold px-3 py-2 rounded-xs border border-[#A3E635]/30 transition-all"
                      id={`momo-btn-${idx}`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      MoMo QR
                    </button>
                    
                    <button
                      onClick={() => handleSettleClick(trans)}
                      className="bg-black hover:bg-black/95 text-white text-[9px] uppercase tracking-widest font-bold px-4 py-2 rounded-xs transition-all"
                      id={`settle-btn-${idx}`}
                    >
                      Settle Up
                    </button>
                  </div>
                </div>
              );
            })}
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
                            <span className="font-serif italic font-bold text-rose-700">{Math.round(t.amount).toLocaleString('vi-VN')} ₫</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-1.5 border-t border-black/5 text-[10px] font-bold text-black/50 uppercase tracking-wide">
                          <span>Total Owed</span>
                          <span className="text-rose-700">{Math.round(totalOwedToOthers).toLocaleString('vi-VN')} ₫</span>
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
                            <span className="font-serif italic font-bold text-black">{Math.round(t.amount).toLocaleString('vi-VN')} ₫</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-1.5 border-t border-black/5 text-[10px] font-bold text-black/50 uppercase tracking-wide">
                          <span>Total to Receive</span>
                          <span className="text-black">{Math.round(totalOwedFromOthers).toLocaleString('vi-VN')} ₫</span>
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

      {/* MoMo Payment Modal */}
      {activeMomoTrans && (() => {
        const calculatedVndAmount = Math.round(activeMomoTrans.amount);
        const displayVndAmount = vndAmountOverride !== '' ? parseInt(vndAmountOverride) || 0 : calculatedVndAmount;
        const noteClean = encodeURIComponent(`SplitFair ${activeMomoTrans.fromName} thanh toan ${activeMomoTrans.toName}`);
        const qrImageSrc = momoPhoneInput 
          ? `https://img.vietqr.io/image/momo-${momoPhoneInput}-compact2.jpg?amount=${displayVndAmount}&addInfo=${noteClean}` 
          : '';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
            <div className="bg-white rounded-xs border border-black/10 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
              {/* Header */}
              <div className="border-b border-black/5 px-6 py-4 flex items-center justify-between bg-[#F4F2EE]">
                <div>
                  <span className="text-[9px] font-bold text-black/50 uppercase tracking-widest block">Vietnamese MoMo Integration</span>
                  <h4 className="font-serif italic text-base text-black font-semibold">Pay {activeMomoTrans.toName} via MoMo</h4>
                </div>
                <button 
                  onClick={() => setActiveMomoTrans(null)}
                  className="p-1 rounded-full hover:bg-black/5 text-black/50 hover:text-black transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
                {/* Phone configuration form */}
                {isUpdatingPhone ? (
                  <div className="p-4 bg-stone-50 border border-black/5 rounded-xs space-y-3">
                    <h5 className="text-[10px] font-bold text-black/60 uppercase tracking-wider flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5 text-stone-500" />
                      Set Recipient MoMo Phone Number
                    </h5>
                    <p className="text-xs text-black/50 leading-relaxed">
                      To pay <strong>{activeMomoTrans.toName}</strong>, enter their MoMo-registered phone number below to generate their payment QR code.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="e.g. 0912345678"
                        value={momoPhoneInput}
                        onChange={(e) => setMomoPhoneInput(e.target.value)}
                        className="flex-1 bg-white border border-black/15 focus:border-black rounded-xs px-3 py-1.5 text-xs text-black transition-all focus:outline-none"
                      />
                      <button
                        onClick={handleSavePhone}
                        disabled={!momoPhoneInput.trim()}
                        className="bg-black hover:bg-black/90 disabled:bg-black/20 text-white text-[10px] uppercase tracking-wider font-bold px-4 py-1.5 rounded-xs transition-all"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center bg-[#F4F2EE]/40 border border-black/5 p-3.5 rounded-xs">
                    <div>
                      <span className="text-[9px] font-bold text-black/40 uppercase tracking-widest block">Recipient Phone</span>
                      <span className="text-xs font-bold font-mono text-black">{momoPhoneInput}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopyPhone}
                        className="inline-flex items-center gap-1 text-[9px] uppercase font-bold text-black bg-white hover:bg-black/5 border border-black/15 px-2 py-1 rounded-xs transition-all"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedText ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => setIsUpdatingPhone(true)}
                        className="inline-flex items-center gap-1 text-[9px] uppercase font-bold text-black/60 hover:text-black px-2 py-1 transition-all"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}

                {momoPhoneInput && (
                  <>
                    {/* Value override configuration */}
                    <div className="bg-[#F4F2EE]/20 p-4 border border-black/5 rounded-xs">
                      <label className="text-[9px] font-bold text-black/40 uppercase tracking-widest block mb-1">VND Amount Override (Optional)</label>
                      <input
                        type="text"
                        placeholder={`${calculatedVndAmount.toLocaleString('vi-VN')} ₫`}
                        value={vndAmountOverride}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setVndAmountOverride(val);
                        }}
                        className="w-full bg-white border border-black/10 focus:border-black rounded-xs px-2.5 py-1 text-xs text-black transition-all focus:outline-none font-mono"
                      />
                    </div>

                    {/* Summary */}
                    <div className="text-center space-y-1">
                      <p className="text-xs text-black/50 font-medium">Original Debt: <strong className="text-black">{calculatedVndAmount.toLocaleString('vi-VN')} ₫</strong></p>
                      <p className="text-xl font-serif italic font-bold text-black">
                        {displayVndAmount.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>

                    {/* QR Image Wrapper */}
                    <div className="flex flex-col items-center justify-center p-4 border border-black/5 bg-white rounded-xs shadow-inner">
                      <div className="relative w-52 h-52 border-4 border-[#A3E635]/30 rounded-xs flex items-center justify-center bg-stone-50 overflow-hidden">
                        <img 
                          src={qrImageSrc} 
                          alt="MoMo payment QR code" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const altUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent('https://nhantien.momo.vn/' + momoPhoneInput + '/' + displayVndAmount)}`;
                            (e.target as HTMLImageElement).src = altUrl;
                          }}
                        />
                      </div>
                      <span className="text-[9px] text-black/40 uppercase font-semibold tracking-wider mt-3">Scan with MoMo App or Bank App</span>
                    </div>

                    {/* Quick links & action */}
                    <div className="flex flex-col gap-2.5">
                      <a
                        href={`https://nhantien.momo.vn/${momoPhoneInput}/${displayVndAmount}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-white hover:bg-black/5 border border-black/20 text-black text-xs font-bold py-2.5 rounded-xs transition-all shadow-2xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open MoMo Transfer Link
                      </a>

                      <button
                        onClick={() => {
                          handleSettleClick(activeMomoTrans);
                          setActiveMomoTrans(null);
                        }}
                        className="w-full bg-[#1A1A1A] hover:bg-black text-[#A3E635] text-xs uppercase tracking-widest font-bold py-3 rounded-xs transition-all shadow-md flex items-center justify-center gap-1"
                      >
                        <Check className="w-4 h-4 text-[#A3E635]" />
                        Mark Paid &amp; Record Settlement
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
