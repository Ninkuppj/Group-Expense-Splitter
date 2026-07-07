import { useState, useEffect } from 'react';
import { Landmark, Sparkles, TrendingUp, Receipt, Wallet, Plus, HelpCircle, Check, ArrowRight } from 'lucide-react';
import { Group, Member, Expense, AVATAR_COLORS, MenuItem } from './types';
import GroupList from './components/GroupList';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import DebtSettle from './components/DebtSettle';
import Dashboard from './components/Dashboard';

// Helper to seed initial demo data if localStorage is empty
const SEED_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Ski Cabin 2026',
    description: 'Annual snowboarding trip to Tahoe with roommates',
    createdAt: new Date().toISOString().split('T')[0],
    members: [
      { id: 'm1', name: 'John Doe', email: 'john@example.com', avatarColor: 'bg-emerald-500 text-white' },
      { id: 'm2', name: 'Alice Smith', email: 'alice@example.com', avatarColor: 'bg-blue-500 text-white' },
      { id: 'm3', name: 'Bob Jones', email: 'bob@example.com', avatarColor: 'bg-indigo-500 text-white' },
      { id: 'm4', name: 'Clara White', email: 'clara@example.com', avatarColor: 'bg-rose-500 text-white' },
    ],
    expenses: [
      {
        id: 'e1',
        description: 'Cabin Chalet Lodging',
        amount: 1200,
        date: '2026-07-02',
        category: 'Lodging',
        note: 'Tahoe wood cabin deposit',
        payers: { 'm1': 1200 }, // John paid
        splitType: 'equal',
        splits: { 'm1': 1, 'm2': 1, 'm3': 1, 'm4': 1 } // Shared equally among all 4
      },
      {
        id: 'e2',
        description: 'Ski Lodge Dinner',
        amount: 240,
        date: '2026-07-03',
        category: 'Food',
        note: 'Tacos & drinks at base camp',
        payers: { 'm2': 180, 'm3': 60 }, // Alice paid $180, Bob paid $60
        splitType: 'percentage',
        splits: { 'm1': 25, 'm2': 25, 'm3': 25, 'm4': 25 } // Split 25% each
      },
      {
        id: 'e3',
        description: 'Groceries & Supplies',
        amount: 140,
        date: '2026-07-04',
        category: 'Food',
        note: 'Target snack run',
        payers: { 'm3': 140 }, // Bob paid
        splitType: 'unequal',
        splits: { 'm1': 40, 'm2': 40, 'm3': 20, 'm4': 40 } // Custom individual amounts
      }
    ]
  },
  {
    id: 'g2',
    name: 'Apartment 4B',
    description: 'Monthly utility and rent splitting',
    createdAt: new Date().toISOString().split('T')[0],
    members: [
      { id: 'm5', name: 'Emma Watson', email: 'emma@example.com', avatarColor: 'bg-violet-500 text-white' },
      { id: 'm6', name: 'Liam Neeson', email: 'liam@example.com', avatarColor: 'bg-amber-500 text-white' },
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

export default function App() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'settle'>('dashboard');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('splitter_groups_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setGroups(parsed);
          setActiveGroupId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error("Error loading localStorage data", e);
      }
    }
    // Fallback to seeds
    setGroups(SEED_GROUPS);
    setActiveGroupId(SEED_GROUPS[0].id);
  }, []);

  // Sync to LocalStorage
  const saveState = (updatedGroups: Group[]) => {
    setGroups(updatedGroups);
    localStorage.setItem('splitter_groups_data', JSON.stringify(updatedGroups));
  };

  const activeGroup = groups.find(g => g.id === activeGroupId) || null;

  // Handler: Create Group
  const handleCreateGroup = (name: string, description: string) => {
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date().toISOString().split('T')[0],
      members: [
        { id: 'm_owner', name: 'You (Me)', avatarColor: 'bg-slate-900 text-white' }
      ],
      expenses: []
    };
    const updated = [newGroup, ...groups];
    saveState(updated);
    setActiveGroupId(newGroup.id);
  };

  // Handler: Delete Group
  const handleDeleteGroup = (groupId: string) => {
    const updated = groups.filter(g => g.id !== groupId);
    saveState(updated);
    if (activeGroupId === groupId) {
      setActiveGroupId(updated[0]?.id || null);
    }
  };

  // Handler: Add Member to Group
  const handleAddMember = (groupId: string, name: string, email?: string) => {
    const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
    const newMember: Member = {
      id: crypto.randomUUID(),
      name,
      email,
      avatarColor: randomColor
    };

    const updated = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          members: [...g.members, newMember]
        };
      }
      return g;
    });
    saveState(updated);
  };

  // Handler: Create or Update Expense
  const handleSaveExpense = (expense: Expense) => {
    if (!activeGroupId) return;

    const updated = groups.map(g => {
      if (g.id === activeGroupId) {
        const isEdit = g.expenses.some(e => e.id === expense.id);
        const nextExpenses = isEdit
          ? g.expenses.map(e => e.id === expense.id ? expense : e)
          : [expense, ...g.expenses];

        return {
          ...g,
          expenses: nextExpenses
        };
      }
      return g;
    });

    saveState(updated);
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  // Handler: Settle Transaction trigger (automatically logs a settlement expense)
  const handleRecordSettlement = (settlementExpense: Expense) => {
    handleSaveExpense(settlementExpense);
  };

  // Handler: Edit Expense trigger (opens form in edit mode)
  const handleEditExpenseTrigger = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  // Handler: Delete Expense
  const handleDeleteExpense = (expenseId: string) => {
    if (!activeGroupId) return;

    const updated = groups.map(g => {
      if (g.id === activeGroupId) {
        return {
          ...g,
          expenses: g.expenses.filter(e => e.id !== expenseId)
        };
      }
      return g;
    });

    saveState(updated);
  };

  // Handler: Update Group Custom Menu
  const handleUpdateGroupMenu = (groupId: string, menu: MenuItem[]) => {
    const updated = groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          customMenu: menu
        };
      }
      return g;
    });
    saveState(updated);
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#1A1A1A] antialiased font-sans">
      {/* 1. Global Navigation Hub */}
      <header className="sticky top-0 z-40 bg-[#F9F7F2]/90 backdrop-blur-md border-b border-black/5" id="app-header">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2 shrink-0">
            <h1 className="font-bold text-2xl tracking-tighter uppercase text-[#1A1A1A] font-sans">SplitFair.</h1>
            <span className="text-[9px] uppercase tracking-[0.25em] opacity-40 font-bold hidden sm:inline-block">Group Expense Logic</span>
          </div>

          {activeGroup && (
            <div className="hidden md:flex items-center gap-2 bg-[#F4F2EE] px-4 py-1.5 rounded-xs border border-black/5" id="header-active-group-tag">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-[#1A1A1A]">{activeGroup.name}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {activeGroup && (
              <button
                onClick={() => {
                  setEditingExpense(null);
                  setIsFormOpen(!isFormOpen);
                }}
                className={`inline-flex items-center gap-1.5 font-bold text-[10px] uppercase tracking-[0.18em] px-5 py-3 rounded-xs transition-all ${isFormOpen ? 'bg-[#F4F2EE] text-[#1A1A1A] border border-black/15' : 'bg-black text-white hover:bg-black/90'}`}
                id="toggle-expense-form-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isFormOpen ? 'Close Editor' : 'Record Expense'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        {!activeGroupId ? (
          <div className="max-w-xl mx-auto py-20 text-center bg-white border border-black/5 p-10 rounded-xs shadow-xl" id="no-groups-fallback">
            <Landmark className="w-12 h-12 text-black/20 mx-auto mb-6" />
            <h2 className="font-serif italic text-3xl text-[#1A1A1A] mb-3">Welcome to SplitFair.</h2>
            <p className="text-xs text-[#1A1A1A]/60 mb-8 max-w-sm mx-auto leading-relaxed">Create a splitting group first to manage roommates, trips, dinners or common utilities with elegant precision.</p>
            <GroupList
              groups={groups}
              activeGroupId={null}
              onSelectGroup={() => {}}
              onCreateGroup={handleCreateGroup}
              onAddMember={() => {}}
              onDeleteGroup={() => {}}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
            {/* Sidebar Columns (Group lists, Member registers) */}
            <div className="lg:col-span-1 space-y-8">
              <GroupList
                groups={groups}
                activeGroupId={activeGroupId}
                onSelectGroup={(id) => {
                  setActiveGroupId(id);
                  setIsFormOpen(false);
                  setEditingExpense(null);
                }}
                onCreateGroup={handleCreateGroup}
                onAddMember={handleAddMember}
                onDeleteGroup={handleDeleteGroup}
              />
            </div>

            {/* Central Desk (Dashboard, forms, lists) */}
            <div className="lg:col-span-3 space-y-8">
              {/* Dynamic sliding panel for Expense logging */}
              {isFormOpen && activeGroup && (
                <div className="mb-8" id="active-expense-form-container">
                  <ExpenseForm
                    members={activeGroup.members}
                    onSave={handleSaveExpense}
                    onCancel={() => {
                      setIsFormOpen(false);
                      setEditingExpense(null);
                    }}
                    editingExpense={editingExpense}
                    customMenu={activeGroup.customMenu || []}
                    onUpdateMenu={(menu) => handleUpdateGroupMenu(activeGroup.id, menu)}
                  />
                </div>
              )}

              {/* View Selector Tabs styled in the elegant Editorial theme */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-black/10 pb-4 gap-4" id="view-tabs-container">
                <div className="flex items-center gap-8" id="view-tabs">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`pb-4 -mb-4 font-bold text-[11px] uppercase tracking-[0.2em] transition-all relative ${activeTab === 'dashboard' ? 'text-black' : 'text-black/40 hover:text-black'}`}
                    id="tab-dashboard"
                  >
                    Dashboard
                    {activeTab === 'dashboard' && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('expenses')}
                    className={`pb-4 -mb-4 font-bold text-[11px] uppercase tracking-[0.2em] transition-all relative ${activeTab === 'expenses' ? 'text-black' : 'text-black/40 hover:text-black'}`}
                    id="tab-expenses"
                  >
                    Expenses
                    {activeTab === 'expenses' && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('settle')}
                    className={`pb-4 -mb-4 font-bold text-[11px] uppercase tracking-[0.2em] transition-all relative ${activeTab === 'settle' ? 'text-black' : 'text-black/40 hover:text-black'}`}
                    id="tab-settle"
                  >
                    Settle Up
                    {activeTab === 'settle' && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
                    )}
                  </button>
                </div>

                <div className="text-[10px] text-black/50 font-semibold uppercase tracking-widest text-left">
                  {activeGroup ? `${activeGroup.expenses.length} Sessions logged` : ''}
                </div>
              </div>

              {/* View Renderings */}
              {activeGroup && (
                <div className="space-y-8" id="rendered-tab-view">
                  {activeTab === 'dashboard' && (
                    <Dashboard
                      members={activeGroup.members}
                      expenses={activeGroup.expenses}
                    />
                  )}

                  {activeTab === 'expenses' && (
                    <ExpenseList
                      members={activeGroup.members}
                      expenses={activeGroup.expenses}
                      onEdit={handleEditExpenseTrigger}
                      onDelete={handleDeleteExpense}
                    />
                  )}

                  {activeTab === 'settle' && (
                    <DebtSettle
                      members={activeGroup.members}
                      expenses={activeGroup.expenses}
                      onRecordSettlement={handleRecordSettlement}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer footer */}
      <footer className="border-t border-black/5 bg-[#F4F2EE] py-10 mt-20 text-center text-[10px] text-black/40 uppercase tracking-[0.2em] font-semibold">
        <p>© 2026 SplitFair. Designed with Editorial Aesthetic Precision &amp; Group Ledger Logic.</p>
      </footer>
    </div>
  );
}
