import { useState } from 'react';
import { Utensils, Plane, Home, Film, Zap, Receipt, Trash2, Edit3, ChevronDown, ChevronUp, Calendar, ArrowRight, Image as ImageIcon, X } from 'lucide-react';
import { Member, Expense, CATEGORIES } from '../types';
import { calculateExpenseOwed } from '../utils/settle';

interface ExpenseListProps {
  members: Member[];
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseList({ members, expenses, onEdit, onDelete }: ExpenseListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return <Utensils className="w-3.5 h-3.5 text-black" />;
      case 'travel':
        return <Plane className="w-3.5 h-3.5 text-[#5A554C]" />;
      case 'lodging':
        return <Home className="w-3.5 h-3.5 text-[#8E8675]" />;
      case 'entertainment':
        return <Film className="w-3.5 h-3.5 text-[#BBAE9A]" />;
      case 'utilities':
        return <Zap className="w-3.5 h-3.5 text-[#9E9482]" />;
      default:
        return <Receipt className="w-3.5 h-3.5 text-[#D2C9B9]" />;
    }
  };

  const getCategoryBg = (category: string) => {
    switch (category.toLowerCase()) {
      case 'food':
        return 'bg-black/[0.03] border-black/10';
      case 'travel':
        return 'bg-[#5A554C]/[0.05] border-[#5A554C]/20';
      case 'lodging':
        return 'bg-[#8E8675]/[0.05] border-[#8E8675]/20';
      case 'entertainment':
        return 'bg-[#BBAE9A]/[0.05] border-[#BBAE9A]/20';
      case 'utilities':
        return 'bg-[#9E9482]/[0.05] border-[#9E9482]/20';
      default:
        return 'bg-[#D2C9B9]/[0.05] border-[#D2C9B9]/20';
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const formatPayersSummary = (payers: { [id: string]: number }) => {
    const entries = Object.entries(payers);
    if (entries.length === 0) return 'No payer';
    if (entries.length === 1) {
      const name = members.find(m => m.id === entries[0][0])?.name || 'Someone';
      return `${name} paid`;
    }
    // Multi payers
    const mainPayerId = entries.reduce((maxId, current) => current[1] > payers[maxId] ? current[0] : maxId, entries[0][0]);
    const name = members.find(m => m.id === mainPayerId)?.name || 'Someone';
    return `${name} & ${entries.length - 1} others paid`;
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-xs border border-black/5 p-12 text-center shadow-xs" id="expense-list-empty">
        <Receipt className="w-8 h-8 text-black/20 mx-auto mb-4" />
        <h3 className="font-serif italic text-lg text-[#1A1A1A] mb-1">No sessions logged yet</h3>
        <p className="font-sans text-xs text-black/40 max-w-xs mx-auto leading-relaxed">Fill out the ledger form above to log your group's first structured transaction.</p>
      </div>
    );
  }

  // Sort expenses by date descending
  const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4" id="expense-list-container">
      <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mb-4 pb-2 border-b border-black/5">Expense History ({expenses.length})</h3>

      <div className="space-y-3">
        {sortedExpenses.map(expense => {
          const isExpanded = expandedId === expense.id;
          const payersSummary = formatPayersSummary(expense.payers);
          const icon = getCategoryIcon(expense.category);
          const bg = getCategoryBg(expense.category);
          const owedMap = calculateExpenseOwed(expense, members);

          return (
            <div
              key={expense.id}
              className={`bg-white border transition-all duration-200 overflow-hidden rounded-xs ${isExpanded ? 'border-black/20 shadow-xs' : 'border-black/5 hover:border-black/15'}`}
              id={`expense-card-${expense.id}`}
            >
              {/* Header block (always visible) */}
              <div
                onClick={() => toggleExpand(expense.id)}
                className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-9 h-9 rounded-full border shrink-0 flex items-center justify-center ${bg}`}>
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-[#1A1A1A] tracking-tight truncate">{expense.description}</h4>
                    <p className="text-[10px] text-black/40 uppercase tracking-wider font-semibold flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span>{payersSummary}</span>
                      <span>•</span>
                      <span>{expense.splitType} split</span>
                      {expense.billImage && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 bg-black/[0.03] text-black/60 px-1.5 py-0.5 rounded-2xs border border-black/5">
                            <ImageIcon className="w-2.5 h-2.5" />
                            Receipt Attached
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="font-serif italic text-base font-bold text-[#1A1A1A]">${expense.amount.toFixed(2)}</span>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-black/30 flex items-center justify-end gap-1 mt-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {expense.date}
                    </p>
                  </div>
                  <div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-black/40" /> : <ChevronDown className="w-4 h-4 text-black/40" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Details Panel */}
              {isExpanded && (
                <div className="border-t border-black/5 bg-[#F4F2EE]/40 p-5 font-sans text-xs space-y-5">
                  {/* Annotation and Attached Bill Image Block */}
                  {(expense.note || expense.billImage) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {expense.note && (
                        <div className="bg-[#F4F2EE]/60 border border-black/5 rounded-xs p-4 flex flex-col justify-center">
                          <p className="text-[9px] uppercase tracking-widest font-bold text-black/40 mb-1">Annotation</p>
                          <p className="text-black/80 font-serif italic text-xs leading-relaxed">"{expense.note}"</p>
                        </div>
                      )}
                      {expense.billImage && (
                        <div className="bg-[#F4F2EE]/60 border border-black/5 rounded-xs p-4 flex flex-col items-start justify-center">
                          <p className="text-[9px] uppercase tracking-widest font-bold text-black/40 mb-1.5">Attached Bill / Receipt</p>
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomedImage(expense.billImage!);
                            }}
                            className="cursor-zoom-in relative group max-h-36 rounded-xs overflow-hidden border border-black/10 bg-white p-1 hover:border-black/25 transition-all self-center md:self-auto"
                          >
                            <img src={expense.billImage} alt="Bill receipt" className="max-h-24 object-contain rounded-2xs" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <span className="text-[9px] text-white font-bold uppercase tracking-wider">Click to zoom</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Daily Bill Itemized Display */}
                  {expense.billType === 'daily' && expense.menuItems && expense.menuItems.length > 0 && (
                    <div className="bg-white border border-black/5 rounded-xs p-5 shadow-2xs">
                      <h5 className="font-bold text-black/40 mb-3.5 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-black/40" />
                        Daily Menu Consumption Details
                      </h5>
                      <div className="space-y-3">
                        {expense.menuItems.map(item => {
                          const itemConsumers = item.consumers.map(cId => members.find(m => m.id === cId)?.name || 'Someone').join(', ');
                          return (
                            <div key={item.id} className="pb-3 border-b border-black/[0.03] last:border-none last:pb-0 text-xs flex justify-between items-start gap-4">
                              <div>
                                <span className="font-bold text-black">{item.name}</span>
                                <span className="text-black/40 text-[10px] ml-1.5">x{item.quantity}</span>
                                <p className="text-[10px] text-stone-500 font-medium mt-0.5">Consumed by: {itemConsumers || 'Nobody'}</p>
                              </div>
                              <span className="font-serif italic font-semibold text-stone-800">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Party Bill Itemized Display */}
                  {expense.billType === 'party' && expense.partyItems && expense.partyItems.length > 0 && (
                    <div className="bg-white border border-black/5 rounded-xs p-5 shadow-2xs">
                      <h5 className="font-bold text-black/40 mb-3.5 uppercase tracking-widest text-[9px] flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-black/40" />
                        Party Bill Line-Itemized Allocations
                      </h5>
                      <div className="space-y-3">
                        {expense.partyItems.map(item => {
                          const targetName = item.type === 'group'
                            ? 'Group (Shared equally)'
                            : members.find(m => m.id === item.targetId)?.name || 'Someone';

                          return (
                            <div key={item.id} className="pb-2 border-b border-black/[0.03] last:border-none last:pb-0 text-xs flex justify-between items-center">
                              <div>
                                <span className="font-bold text-black">{item.name}</span>
                                <span className="text-[9px] uppercase tracking-wider font-bold text-black/40 bg-[#F4F2EE] px-1.5 py-0.5 rounded-2xs border border-black/5 ml-2.5">
                                  {targetName}
                                </span>
                              </div>
                              <span className="font-serif italic font-semibold text-stone-800">${item.price.toFixed(2)}</span>
                            </div>
                          );
                        })}
                        
                        {(() => {
                          const itemizedTotal = expense.partyItems!.reduce((sum, i) => sum + i.price, 0);
                          const leftover = expense.amount - itemizedTotal;
                          if (leftover > 0.01) {
                            return (
                              <div className="pt-2 border-t border-dashed border-stone-200 text-xs flex justify-between items-center text-stone-500 font-medium">
                                <span>Remaining balance (tax/tips split equally)</span>
                                <span className="font-serif italic font-semibold">${leftover.toFixed(2)}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Splits detailed breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Payers Ledger */}
                    <div className="bg-white border border-black/5 rounded-xs p-4 shadow-2xs">
                      <h5 className="font-bold text-black/40 mb-3 uppercase tracking-widest text-[9px]">Payer Distribution</h5>
                      <div className="space-y-2">
                        {members.map(m => {
                          const paid = expense.payers[m.id] || 0;
                          if (paid <= 0) return null;
                          return (
                            <div key={m.id} className="flex justify-between items-center text-black/80 font-medium">
                              <span className="text-xs">{m.name}</span>
                              <span className="font-semibold text-black">${paid.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Owes Ledger */}
                    <div className="bg-white border border-black/5 rounded-xs p-4 shadow-2xs">
                      <h5 className="font-bold text-black/40 mb-3 uppercase tracking-widest text-[9px]">Obligations Ledger</h5>
                      <div className="space-y-2">
                        {members.map(m => {
                          const owes = owedMap[m.id] || 0;
                          if (owes <= 0) return null;
                          return (
                            <div key={m.id} className="flex justify-between items-center text-black/80 font-medium">
                              <span className="text-xs">{m.name}</span>
                              <span className="font-semibold text-black">${owes.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-black/5">
                    <span className="text-[9px] text-black/30 font-sans uppercase tracking-widest font-bold">Ledger Key: {expense.id.slice(0, 8)}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(expense)}
                        className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-black bg-[#F4F2EE] hover:bg-black/5 border border-black/10 px-3 py-1.5 rounded-xs transition-all"
                        id={`edit-expense-${expense.id}`}
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(expense.id)}
                        className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-wider font-bold text-rose-700 hover:text-rose-900 bg-rose-50/50 hover:bg-rose-50 border border-rose-200/50 px-3 py-1.5 rounded-xs transition-all"
                        id={`delete-expense-${expense.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white p-2 rounded-xs shadow-2xl cursor-default" onClick={e => e.stopPropagation()}>
            <img src={zoomedImage} alt="Receipt Fullscreen" className="max-h-[80vh] max-w-full object-contain rounded-xs" referrerPolicy="no-referrer" />
            <button 
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white p-1.5 rounded-full transition-all shadow-md"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
