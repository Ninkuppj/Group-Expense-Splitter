import { Member, Expense, MemberBalance, DebtTransaction } from '../types';

/**
 * Calculates how much each member owes for a single expense.
 */
export function calculateExpenseOwed(expense: Expense, groupMembers: Member[]): { [memberId: string]: number } {
  const owed: { [memberId: string]: number } = {};
  const { amount, splitType, splits } = expense;
  
  // Initialize owed for all members in splits or group to 0
  const participantIds = Object.keys(splits).filter(id => splits[id] > 0);
  
  // If splits is empty, default participants to all members in the group
  const actualParticipants = participantIds.length > 0 
    ? participantIds 
    : groupMembers.map(m => m.id);

  if (splitType === 'equal') {
    const share = amount / actualParticipants.length;
    actualParticipants.forEach(id => {
      owed[id] = share;
    });
  } else if (splitType === 'unequal') {
    actualParticipants.forEach(id => {
      owed[id] = splits[id] || 0;
    });
  } else if (splitType === 'percentage') {
    actualParticipants.forEach(id => {
      owed[id] = (amount * (splits[id] || 0)) / 100;
    });
  } else if (splitType === 'shares') {
    const totalShares = actualParticipants.reduce((sum, id) => sum + (splits[id] || 0), 0);
    if (totalShares > 0) {
      actualParticipants.forEach(id => {
        owed[id] = (amount * (splits[id] || 0)) / totalShares;
      });
    } else {
      // Fallback to equal if total shares is 0
      const share = amount / actualParticipants.length;
      actualParticipants.forEach(id => {
        owed[id] = share;
      });
    }
  }

  return owed;
}

/**
 * Computes balances for all members in a group.
 */
export function calculateBalances(members: Member[], expenses: Expense[]): MemberBalance[] {
  // Initialize balances map
  const balances: { [memberId: string]: { paid: number; owed: number } } = {};
  members.forEach(m => {
    balances[m.id] = { paid: 0, owed: 0 };
  });

  expenses.forEach(expense => {
    // 1. Process what was paid
    Object.entries(expense.payers).forEach(([memberId, paidAmt]) => {
      if (balances[memberId]) {
        balances[memberId].paid += paidAmt;
      }
    });

    // 2. Process what was owed
    const owedMap = calculateExpenseOwed(expense, members);
    Object.entries(owedMap).forEach(([memberId, owedAmt]) => {
      if (balances[memberId]) {
        balances[memberId].owed += owedAmt;
      }
    });
  });

  return members.map(m => {
    const bal = balances[m.id] || { paid: 0, owed: 0 };
    return {
      memberId: m.id,
      memberName: m.name,
      paidAmount: bal.paid,
      owedAmount: bal.owed,
      netBalance: bal.paid - bal.owed
    };
  });
}

/**
 * Computes optimized set of transactions to settle all debts.
 * Minimizes the total number of transfers.
 */
export function calculateDebtSettlement(members: Member[], expenses: Expense[]): DebtTransaction[] {
  const balances = calculateBalances(members, expenses);
  
  // Filter and map debtors (netBalance < -0.01) and creditors (netBalance > 0.01)
  // We use 0.01 to prevent floating point inaccuracies
  let debtors = balances
    .filter(b => b.netBalance < -0.01)
    .map(b => ({ id: b.memberId, name: b.memberName, balance: b.netBalance }))
    .sort((a, b) => a.balance - b.balance); // Sorted ascending (most negative first)

  let creditors = balances
    .filter(b => b.netBalance > 0.01)
    .map(b => ({ id: b.memberId, name: b.memberName, balance: b.netBalance }))
    .sort((a, b) => b.balance - a.balance); // Sorted descending (most positive first)

  const transactions: DebtTransaction[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const oweAmount = Math.abs(debtor.balance);
    const receiveAmount = creditor.balance;

    const settledAmount = Math.min(oweAmount, receiveAmount);
    
    // Round to 2 decimal places to avoid floating point anomalies in UI
    const finalAmount = Math.round(settledAmount * 100) / 100;

    if (finalAmount > 0) {
      transactions.push({
        fromId: debtor.id,
        fromName: debtor.name,
        toId: creditor.id,
        toName: creditor.name,
        amount: finalAmount
      });
    }

    debtor.balance += settledAmount;
    creditor.balance -= settledAmount;

    if (Math.abs(debtor.balance) < 0.01) {
      dIdx++;
    }
    if (Math.abs(creditor.balance) < 0.01) {
      cIdx++;
    }
  }

  return transactions;
}
