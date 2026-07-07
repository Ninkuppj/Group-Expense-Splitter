import React, { useState, useEffect } from 'react';
import { Plus, Check, DollarSign, Calendar, Tag, FileText, Split, Users, Sparkles, Upload, Image as ImageIcon, X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Member, Expense, SplitType, CATEGORIES, MenuItem, MenuItemInstance, PartyItemInstance } from '../types';
import AiAssistant from './AiAssistant';

const DEFAULT_MENU_ITEMS: MenuItem[] = [
  { id: 'item-1', name: 'Cheese Pizza', price: 14.00, category: 'Food' },
  { id: 'item-2', name: 'Caesar Salad', price: 10.50, category: 'Food' },
  { id: 'item-3', name: 'Garlic Bread', price: 6.00, category: 'Food' },
  { id: 'item-4', name: 'Beef Burger', price: 15.50, category: 'Food' },
  { id: 'item-5', name: 'French Fries', price: 5.00, category: 'Food' },
  { id: 'item-6', name: 'Spaghetti Carbonara', price: 16.50, category: 'Food' },
  { id: 'item-7', name: 'Craft Beer', price: 7.00, category: 'Drink' },
  { id: 'item-8', name: 'Iced Latte', price: 4.50, category: 'Drink' },
  { id: 'item-9', name: 'Chocolate Lava Cake', price: 8.50, category: 'Food' },
  { id: 'item-10', name: 'Soft Drink', price: 2.50, category: 'Drink' },
];

interface ExpenseFormProps {
  members: Member[];
  onSave: (expense: Expense) => void;
  onCancel?: () => void;
  editingExpense?: Expense | null;
  customMenu?: MenuItem[];
  onUpdateMenu?: (menu: MenuItem[]) => void;
}

export default function ExpenseForm({
  members,
  onSave,
  onCancel,
  editingExpense,
  customMenu,
  onUpdateMenu
}: ExpenseFormProps) {
  // Bill Type
  const [billType, setBillType] = useState<'general' | 'daily' | 'party'>('general');

  // Basic states
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [billImage, setBillImage] = useState('');
  
  // Payers State: Key is member ID, Value is amount paid
  const [isMultiPayer, setIsMultiPayer] = useState(false);
  const [singlePayerId, setSinglePayerId] = useState(members[0]?.id || '');
  const [multiPayers, setMultiPayers] = useState<{ [memberId: string]: number }>({});
  
  // Split State
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [splits, setSplits] = useState<{ [memberId: string]: number }>({});

  // Daily Bill States
  const [groupMenu, setGroupMenu] = useState<MenuItem[]>(() => customMenu && customMenu.length > 0 ? customMenu : DEFAULT_MENU_ITEMS);
  const [menuItemSelections, setMenuItemSelections] = useState<MenuItemInstance[]>([]);
  const [isAddingCustomMenuItem, setIsAddingCustomMenuItem] = useState(false);
  const [customMenuItemName, setCustomMenuItemName] = useState('');
  const [customMenuItemPrice, setCustomMenuItemPrice] = useState('');
  const [customMenuItemCategory, setCustomMenuItemCategory] = useState<'Food' | 'Drink'>('Food');
  const [joinedDailyMemberIds, setJoinedDailyMemberIds] = useState<string[]>([]);

  // Party Bill States
  const [partyItemSelections, setPartyItemSelections] = useState<PartyItemInstance[]>([]);
  const [newPartyItemName, setNewPartyItemName] = useState('');
  const [newPartyItemPrice, setNewPartyItemPrice] = useState('');
  const [newPartyItemType, setNewPartyItemType] = useState<'group' | 'individual'>('group');
  const [newPartyItemTargetId, setNewPartyItemTargetId] = useState(members[0]?.id || '');

  // Synchronize menu state when customMenu prop changes
  useEffect(() => {
    if (customMenu && customMenu.length > 0) {
      setGroupMenu(customMenu);
    }
  }, [customMenu]);

  // When editing or members change, initialize states
  useEffect(() => {
    if (editingExpense) {
      const bType = editingExpense.billType || 'general';
      setBillType(bType);
      setDescription(editingExpense.description);
      setAmount(editingExpense.amount);
      setCategory(editingExpense.category);
      setDate(editingExpense.date);
      setNote(editingExpense.note || '');
      setBillImage(editingExpense.billImage || '');
      setSplitType(editingExpense.splitType);
      
      const payerEntries = Object.entries(editingExpense.payers);
      if (payerEntries.length > 1) {
        setIsMultiPayer(true);
        const payersInit: { [id: string]: number } = {};
        members.forEach(m => {
          payersInit[m.id] = editingExpense.payers[m.id] || 0;
        });
        setMultiPayers(payersInit);
      } else {
        setIsMultiPayer(false);
        setSinglePayerId(payerEntries[0]?.[0] || members[0]?.id || '');
      }

      const splitsInit: { [id: string]: number } = {};
      members.forEach(m => {
        splitsInit[m.id] = editingExpense.splits[m.id] !== undefined ? editingExpense.splits[m.id] : 0;
      });
      setSplits(splitsInit);

      if (bType === 'daily' && editingExpense.menuItems) {
        setMenuItemSelections(editingExpense.menuItems);
        const uniqueConsumers = Array.from(new Set(editingExpense.menuItems.flatMap(item => item.consumers)));
        setJoinedDailyMemberIds(uniqueConsumers.length > 0 ? uniqueConsumers : members.map(m => m.id));
      } else {
        setMenuItemSelections([]);
        setJoinedDailyMemberIds(members.map(m => m.id));
      }

      if (bType === 'party' && editingExpense.partyItems) {
        setPartyItemSelections(editingExpense.partyItems);
      } else {
        setPartyItemSelections([]);
      }
    } else {
      // Create mode default values
      setBillType('general');
      setDescription('');
      setAmount(0);
      setCategory('Food');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
      setBillImage('');
      setIsMultiPayer(false);
      setSplitType('equal');
      setMenuItemSelections([]);
      setPartyItemSelections([]);
      setJoinedDailyMemberIds(members.map(m => m.id));
      
      // Default equal split: everyone participates (represented by 1)
      const initialSplits: { [id: string]: number } = {};
      members.forEach(m => {
        initialSplits[m.id] = 1;
      });
      setSplits(initialSplits);

      const initialPayers: { [id: string]: number } = {};
      members.forEach(m => {
        initialPayers[m.id] = 0;
      });
      setMultiPayers(initialPayers);
      if (members.length > 0) {
        setSinglePayerId(members[0].id);
      }
    }
  }, [editingExpense, members]);

  // Handle callback from AI Assistant
  const handleAiParsed = (parsed: Partial<Expense>) => {
    if (parsed.description) setDescription(parsed.description);
    if (parsed.amount) setAmount(parsed.amount);
    if (parsed.category) setCategory(parsed.category);
    if (parsed.splitType) setSplitType(parsed.splitType);
    if (parsed.billImage) setBillImage(parsed.billImage);
    
    // Process parsed payers
    if (parsed.payers) {
      const entries = Object.entries(parsed.payers);
      if (entries.length > 1) {
        setIsMultiPayer(true);
        const pMap: { [id: string]: number } = {};
        members.forEach(m => {
          pMap[m.id] = parsed.payers?.[m.id] || 0;
        });
        setMultiPayers(pMap);
      } else if (entries.length === 1) {
        setIsMultiPayer(false);
        setSinglePayerId(entries[0][0]);
      }
    }

    // Process parsed splits
    if (parsed.splits) {
      const sMap: { [id: string]: number } = {};
      members.forEach(m => {
        sMap[m.id] = parsed.splits?.[m.id] !== undefined ? parsed.splits?.[m.id]! : 0;
      });
      setSplits(sMap);
    }
  };

  // Safe checks and sums
  const totalPaidSum = isMultiPayer
    ? Object.values(multiPayers).reduce((sum: number, val: number) => sum + (val || 0), 0)
    : amount;

  const totalOwedSum = () => {
    if (splitType === 'equal') {
      return amount; // Distributed equally among selected
    }
    if (splitType === 'unequal') {
      return Object.values(splits).reduce((sum: number, val: number) => sum + (val || 0), 0);
    }
    if (splitType === 'percentage') {
      return Object.values(splits).reduce((sum: number, val: number) => sum + (val || 0), 0);
    }
    if (splitType === 'shares') {
      return Object.values(splits).reduce((sum: number, val: number) => sum + (val || 0), 0);
    }
    return 0;
  };

  const isPayerSumValid = !isMultiPayer || Math.abs(totalPaidSum - amount) < 0.01;
  const isSplitSumValid = () => {
    if (amount <= 0) return false;
    if (splitType === 'equal') {
      return Object.values(splits).some((v: number) => v > 0); // At least one participant
    }
    if (splitType === 'unequal') {
      return Math.abs(totalOwedSum() - amount) < 0.01;
    }
    if (splitType === 'percentage') {
      return Math.abs(totalOwedSum() - 100) < 0.01;
    }
    if (splitType === 'shares') {
      return totalOwedSum() > 0;
    }
    return false;
  };

  const handlePayerAmountChange = (memberId: string, val: string) => {
    const numVal = parseFloat(val) || 0;
    setMultiPayers(prev => ({ ...prev, [memberId]: numVal }));
  };

  const handleSplitValueChange = (memberId: string, val: string) => {
    const numVal = parseFloat(val) || 0;
    setSplits(prev => ({ ...prev, [memberId]: numVal }));
  };

  const handleToggleEqualParticipant = (memberId: string) => {
    setSplits(prev => ({
      ...prev,
      [memberId]: prev[memberId] ? 0 : 1
    }));
  };

  // 1. Daily Bill Auto-split effect
  useEffect(() => {
    if (billType === 'daily') {
      let total = 0;
      const computedSplits: { [memberId: string]: number } = {};
      members.forEach(m => { computedSplits[m.id] = 0; });

      menuItemSelections.forEach(item => {
        if (item.quantity > 0 && item.consumers.length > 0) {
          const itemCost = item.price * item.quantity;
          total += itemCost;
          const perConsumer = itemCost / item.consumers.length;
          item.consumers.forEach(cId => {
            computedSplits[cId] = (computedSplits[cId] || 0) + perConsumer;
          });
        }
      });

      setAmount(parseFloat(total.toFixed(2)));
      setSplitType('unequal');
      setCategory('Food'); // Auto prefill category
      
      const activeMemberIds = Object.keys(computedSplits).filter(id => computedSplits[id] > 0);
      if (activeMemberIds.length > 0) {
        let sumRounded = 0;
        const roundedSplits: { [memberId: string]: number } = {};
        members.forEach(m => {
          const rounded = parseFloat((computedSplits[m.id] || 0).toFixed(2));
          roundedSplits[m.id] = rounded;
          sumRounded += rounded;
        });

        const roundedTotal = parseFloat(total.toFixed(2));
        const difference = roundedTotal - sumRounded;
        if (Math.abs(difference) > 0.001 && activeMemberIds.length > 0) {
          // Adjust difference on first active consumer to avoid broken totals
          const firstId = activeMemberIds[0];
          roundedSplits[firstId] = parseFloat((roundedSplits[firstId] + difference).toFixed(2));
        }
        setSplits(roundedSplits);
      } else {
        setSplits({});
      }
    }
  }, [billType, menuItemSelections, members]);

  // 2. Party Bill Auto-split effect
  useEffect(() => {
    if (billType === 'party') {
      const computedSplits: { [memberId: string]: number } = {};
      members.forEach(m => { computedSplits[m.id] = 0; });

      let itemizedTotal = 0;
      let groupItemsTotal = 0;

      partyItemSelections.forEach(item => {
        itemizedTotal += item.price;
        if (item.type === 'group') {
          groupItemsTotal += item.price;
        } else if (item.type === 'individual' && item.targetId) {
          computedSplits[item.targetId] = (computedSplits[item.targetId] || 0) + item.price;
        }
      });

      const groupPortion = members.length > 0 ? groupItemsTotal / members.length : 0;
      members.forEach(m => {
        computedSplits[m.id] = (computedSplits[m.id] || 0) + groupPortion;
      });

      const leftover = amount - itemizedTotal;
      if (leftover > 0 && members.length > 0) {
        const leftoverPortion = leftover / members.length;
        members.forEach(m => {
          computedSplits[m.id] = (computedSplits[m.id] || 0) + leftoverPortion;
        });
      }

      setSplitType('unequal');
      
      let sumRounded = 0;
      const roundedSplits: { [memberId: string]: number } = {};
      members.forEach(m => {
        const rounded = parseFloat((computedSplits[m.id] || 0).toFixed(2));
        roundedSplits[m.id] = rounded;
        sumRounded += rounded;
      });

      const roundedTotal = parseFloat(amount.toFixed(2));
      const difference = roundedTotal - sumRounded;
      if (Math.abs(difference) > 0.001 && members.length > 0) {
        const firstId = members[0].id;
        roundedSplits[firstId] = parseFloat((roundedSplits[firstId] + difference).toFixed(2));
      }
      setSplits(roundedSplits);
    }
  }, [billType, amount, partyItemSelections, members]);

  // Add Item to Daily Menu
  const handleAddNewMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = customMenuItemName.trim();
    const price = parseFloat(customMenuItemPrice);
    if (!name || isNaN(price) || price <= 0) return;

    const newItem: MenuItem = {
      id: 'menu-' + crypto.randomUUID(),
      name,
      price,
      category: customMenuItemCategory
    };

    const updated = [...groupMenu, newItem];
    setGroupMenu(updated);
    if (onUpdateMenu) {
      onUpdateMenu(updated);
    }

    setCustomMenuItemName('');
    setCustomMenuItemPrice('');
    setIsAddingCustomMenuItem(false);
  };

  const handleToggleJoinedDailyMember = (memberId: string) => {
    setJoinedDailyMemberIds(prev => {
      const isJoined = prev.includes(memberId);
      const updated = isJoined ? prev.filter(id => id !== memberId) : [...prev, memberId];
      
      // Clean up selections for this member if removed
      if (isJoined) {
        setMenuItemSelections(current => current.filter(item => !item.consumers.includes(memberId)));
      }
      return updated;
    });
  };

  const handleAddMemberItem = (memberId: string, menuItem: MenuItem) => {
    setMenuItemSelections(prev => {
      // Find if this exact menu item is already selected for this exact member
      const instanceId = `${menuItem.id}-${memberId}`;
      const existing = prev.find(item => item.id === instanceId);
      
      if (existing) {
        return prev.map(item => item.id === instanceId ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prev, {
          id: instanceId,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          consumers: [memberId]
        }];
      }
    });
  };

  const handleUpdateMemberItemQty = (memberId: string, menuItemId: string, delta: number) => {
    setMenuItemSelections(prev => {
      const instanceId = `${menuItemId}-${memberId}`;
      const existing = prev.find(item => item.id === instanceId);
      if (!existing) return prev;
      
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter(item => item.id !== instanceId);
      } else {
        return prev.map(item => item.id === instanceId ? { ...item, quantity: nextQty } : item);
      }
    });
  };

  // Increment item selection in Daily Bill
  const handleDailyQtyChange = (menuItem: MenuItem, delta: number) => {
    setMenuItemSelections(prev => {
      const existing = prev.find(item => item.id === menuItem.id);
      if (existing) {
        const nextQty = Math.max(0, existing.quantity + delta);
        if (nextQty === 0) {
          return prev.filter(item => item.id !== menuItem.id);
        }
        return prev.map(item => item.id === menuItem.id ? { ...item, quantity: nextQty } : item);
      } else {
        if (delta <= 0) return prev;
        return [...prev, {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          consumers: members.map(m => m.id) // Defaults to all members split
        }];
      }
    });
  };

  // Toggle member consumer in Daily Bill Item
  const handleDailyToggleConsumer = (itemId: string, memberId: string) => {
    setMenuItemSelections(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const isIncluded = item.consumers.includes(memberId);
          const nextConsumers = isIncluded
            ? item.consumers.filter(id => id !== memberId)
            : [...item.consumers, memberId];
          return { ...item, consumers: nextConsumers };
        }
        return item;
      });
    });
  };

  // Add party itemizer line
  const handleAddPartyItem = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newPartyItemName.trim() || 'Custom Item';
    const price = parseFloat(newPartyItemPrice);
    if (isNaN(price) || price <= 0) return;

    const newItem: PartyItemInstance = {
      id: 'party-' + crypto.randomUUID(),
      name,
      price,
      type: newPartyItemType,
      targetId: newPartyItemType === 'individual' ? newPartyItemTargetId : undefined
    };

    setPartyItemSelections(prev => [...prev, newItem]);
    
    // Auto-adjust overall total amount if it was 0 or less than itemized total
    const itemizedTotal = partyItemSelections.reduce((sum, item) => sum + item.price, 0) + price;
    if (amount < itemizedTotal) {
      setAmount(parseFloat(itemizedTotal.toFixed(2)));
    }

    setNewPartyItemName('');
    setNewPartyItemPrice('');
  };

  const handleRemovePartyItem = (itemId: string) => {
    setPartyItemSelections(prev => prev.filter(item => item.id !== itemId));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) return;
    if (amount <= 0) return;
    if (!isPayerSumValid) return;
    if (!isSplitSumValid()) return;

    // Build payers object
    const payersObj: { [id: string]: number } = {};
    if (isMultiPayer) {
      Object.entries(multiPayers).forEach(([id, val]) => {
        if ((val as number) > 0) payersObj[id] = val as number;
      });
    } else {
      payersObj[singlePayerId] = amount;
    }

    // Build splits object (only include positive values to avoid noise)
    const splitsObj: { [id: string]: number } = {};
    Object.entries(splits).forEach(([id, val]) => {
      if ((val as number) > 0) splitsObj[id] = val as number;
    });

    const expensePayload: Expense = {
      id: editingExpense?.id || crypto.randomUUID(),
      description: description.trim(),
      amount,
      date,
      category,
      note: note.trim() || undefined,
      billImage: billImage || undefined,
      payers: payersObj,
      splitType,
      splits: splitsObj,
      billType,
      menuItems: billType === 'daily' ? menuItemSelections : undefined,
      partyItems: billType === 'party' ? partyItemSelections : undefined,
    };

    onSave(expensePayload);
  };

  return (
    <div className="bg-white rounded-xs border border-black/5 p-6 md:p-8 shadow-sm" id="expense-editor-component">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-black/5">
        <h2 className="font-serif italic text-xl text-[#1A1A1A] flex items-center gap-2">
          {editingExpense ? 'Edit Ledger Record' : 'Record Ledger Entry'}
        </h2>
        {onCancel && (
          <button
            onClick={onCancel}
            type="button"
            className="text-[9px] font-bold uppercase tracking-wider text-black bg-[#F4F2EE] hover:bg-black/5 px-3.5 py-2 border border-black/10 rounded-xs"
            id="cancel-expense-btn"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Selector for Billing Engine */}
      <div className="mb-6 p-1 bg-[#F4F2EE] border border-black/5 rounded-xs flex" id="billing-type-selector">
        <button
          type="button"
          onClick={() => setBillType('general')}
          className={`flex-1 text-center py-2.5 rounded-xs text-[9px] uppercase tracking-wider font-bold transition-all ${billType === 'general' ? 'bg-black text-white shadow-xs' : 'text-black/50 hover:text-black'}`}
        >
          General Bill
        </button>
        <button
          type="button"
          onClick={() => setBillType('daily')}
          className={`flex-1 text-center py-2.5 rounded-xs text-[9px] uppercase tracking-wider font-bold transition-all ${billType === 'daily' ? 'bg-black text-white shadow-xs' : 'text-black/50 hover:text-black'}`}
        >
          Daily Menu Bill
        </button>
        <button
          type="button"
          onClick={() => setBillType('party')}
          className={`flex-1 text-center py-2.5 rounded-xs text-[9px] uppercase tracking-wider font-bold transition-all ${billType === 'party' ? 'bg-black text-white shadow-xs' : 'text-black/50 hover:text-black'}`}
        >
          Party Bill + Receipt
        </button>
      </div>

      {/* AI Assistant at top of form (only for general/standard bills to avoid prompt collisions) */}
      {!editingExpense && billType === 'general' && (
        <AiAssistant members={members} onParsed={handleAiParsed} />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core details grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-bold text-black/40 uppercase tracking-[0.2em] mb-1.5">Description</label>
            <div className="relative">
              <FileText className="absolute left-3.5 top-3 w-4 h-4 text-black/30" />
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={billType === 'daily' ? 'E.g., Group Dinner at Luigi’s' : billType === 'party' ? 'E.g., Weekend Celebration Party' : 'E.g., Airbnb, Groceries, Car rental'}
                className="w-full bg-white border border-black/10 focus:border-black rounded-xs pl-10 pr-4 py-2.5 text-xs text-[#1A1A1A] transition-all font-sans focus:outline-none focus:ring-0 shadow-2xs"
                id="expense-desc-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-black/40 uppercase tracking-[0.2em] mb-1.5">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-black/30" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-black/10 focus:border-black rounded-xs pl-10 pr-4 py-2.5 text-xs text-[#1A1A1A] transition-all font-sans focus:outline-none focus:ring-0 shadow-2xs"
                id="expense-date-input"
              />
            </div>
          </div>

          {billType !== 'daily' && (
            <div>
              <label className="block text-[9px] font-bold text-black/40 uppercase tracking-[0.2em] mb-1.5">Total Amount ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-3 w-4 h-4 text-black/30" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-white border border-black/10 focus:border-black rounded-xs pl-10 pr-4 py-2.5 text-xs text-[#1A1A1A] transition-all font-sans focus:outline-none focus:ring-0 shadow-2xs font-medium"
                  id="expense-amount-input"
                />
              </div>
            </div>
          )}

          {billType !== 'daily' && (
            <div>
              <label className="block text-[9px] font-bold text-black/40 uppercase tracking-[0.2em] mb-1.5">Category</label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-3 w-4 h-4 text-black/30" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-black/10 focus:border-black rounded-xs pl-10 pr-4 py-2.5 text-xs text-[#1A1A1A] transition-all font-sans focus:outline-none focus:ring-0 shadow-2xs appearance-none"
                  id="expense-category-select"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ==================== 1. DAILY MENU BILL ENGINE ==================== */}
        {billType === 'daily' && (
          <div className="bg-[#F4F2EE]/45 border border-black/5 rounded-xs p-5 md:p-6 space-y-6" id="daily-menu-engine">
            <div className="pb-2 border-b border-black/5">
              <h3 className="text-[10px] font-bold text-black uppercase tracking-wider flex items-center justify-between">
                <span>Select Daily Food & Drink Consumption per Member</span>
                <span className="text-[9px] text-black/40 font-bold uppercase tracking-widest bg-white px-2 py-0.5 rounded-2xs border border-black/10 shadow-3xs">
                  Ate Single & Isolated Price
                </span>
              </h3>
              <p className="text-[10px] text-black/40 font-sans mt-1">
                Choose the members who joined, then select their individual food and drink consumption with isolated prices.
              </p>
            </div>

            {/* 1. Choose Members Joined */}
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-black/40 uppercase tracking-[0.15em]">Who joined this meal?</label>
              <div className="flex flex-wrap gap-2">
                {members.map(m => {
                  const isJoined = joinedDailyMemberIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleToggleJoinedDailyMember(m.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xs border transition-all text-xs font-sans ${isJoined ? 'bg-black text-white border-black shadow-xs' : 'bg-white text-black/40 border-black/10 hover:border-black/25 hover:text-black'}`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center border ${isJoined ? 'bg-white border-white text-black' : 'border-black/20'}`}>
                        {isJoined && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                      </div>
                      <span className="font-semibold">{m.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Plates for Joined Members */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {members.filter(m => joinedDailyMemberIds.includes(m.id)).map(m => {
                const memberItems = menuItemSelections.filter(item => item.consumers.includes(m.id));
                const memberTotal = memberItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

                return (
                  <div key={m.id} className="bg-white border border-black/5 hover:border-black/15 p-4 rounded-xs transition-all shadow-2xs flex flex-col justify-between">
                    <div>
                      {/* Plate Header */}
                      <div className="flex items-center justify-between border-b border-black/[0.04] pb-2.5 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-stone-400 font-bold text-xs">🍽️</span>
                          <span className="font-bold text-xs text-black">{m.name}’s Plate</span>
                        </div>
                        <span className="font-serif italic text-xs font-semibold text-stone-800">
                          Subtotal: ${memberTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Consumed Food & Drinks list */}
                      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto pr-1">
                        {memberItems.length === 0 ? (
                          <p className="text-[10px] text-black/30 italic py-1.5">No food or drinks selected.</p>
                        ) : (
                          memberItems.map(item => {
                            const menuItemId = item.id.replace(`-${m.id}`, '');
                            return (
                              <div key={item.id} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-dashed border-black/[0.03] last:border-none">
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-black truncate">{item.name}</span>
                                  <span className="text-[9px] text-black/40 font-serif italic">${item.price.toFixed(2)} each</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex items-center gap-1.5 border border-black/10 bg-[#F4F2EE] rounded-xs p-0.5">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateMemberItemQty(m.id, menuItemId, -1)}
                                      className="w-4 h-4 flex items-center justify-center text-[10px] font-bold text-black/60 hover:text-black"
                                    >
                                      -
                                    </button>
                                    <span className="w-4 text-center text-[10px] font-bold text-black">{item.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateMemberItemQty(m.id, menuItemId, 1)}
                                      className="w-4 h-4 flex items-center justify-center text-[10px] font-bold text-black/60 hover:text-black"
                                    >
                                      +
                                    </button>
                                  </div>
                                  <span className="font-serif italic font-semibold text-stone-800 w-12 text-right">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Food & Drink Dropdowns */}
                    <div className="grid grid-cols-2 gap-2 mt-2 border-t border-black/[0.04] pt-2.5">
                      <div>
                        <label className="block text-[8px] font-bold text-black/40 uppercase tracking-wider mb-1">Add Food</label>
                        <select
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            if (selectedId) {
                              const item = groupMenu.find(menuItem => menuItem.id === selectedId);
                              if (item) handleAddMemberItem(m.id, item);
                              e.target.value = ''; // Reset select
                            }
                          }}
                          className="w-full bg-[#F4F2EE]/50 border border-black/10 hover:border-black/20 rounded-xs px-2 py-1 text-[11px] text-[#1A1A1A] transition-all focus:outline-none"
                        >
                          <option value="">🍽️ Food...</option>
                          {groupMenu.filter(menuItem => menuItem.category.toLowerCase() !== 'drink').map(menuItem => (
                            <option key={menuItem.id} value={menuItem.id}>
                              {menuItem.name} (${menuItem.price.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] font-bold text-black/40 uppercase tracking-wider mb-1">Add Drink</label>
                        <select
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            if (selectedId) {
                              const item = groupMenu.find(menuItem => menuItem.id === selectedId);
                              if (item) handleAddMemberItem(m.id, item);
                              e.target.value = ''; // Reset select
                            }
                          }}
                          className="w-full bg-[#F4F2EE]/50 border border-black/10 hover:border-black/20 rounded-xs px-2 py-1 text-[11px] text-[#1A1A1A] transition-all focus:outline-none"
                        >
                          <option value="">🥤 Drink...</option>
                          {groupMenu.filter(menuItem => menuItem.category.toLowerCase() === 'drink').map(menuItem => (
                            <option key={menuItem.id} value={menuItem.id}>
                              {menuItem.name} (${menuItem.price.toFixed(2)})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Dish/Drink Adder */}
            <div className="border-t border-black/5 pt-3">
              {!isAddingCustomMenuItem ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCustomMenuItem(true)}
                  className="w-full py-2.5 border border-dashed border-black/15 hover:border-black/25 bg-white rounded-xs text-[9px] uppercase tracking-wider font-bold text-black/60 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Custom Dish or Drink to Menu
                </button>
              ) : (
                <div className="bg-white border border-black/10 rounded-xs p-4 space-y-3 shadow-2xs">
                  <h4 className="text-[10px] font-bold text-black uppercase tracking-wider">Add New Menu Item Details</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8px] font-bold text-black/40 uppercase tracking-wider mb-1">Item Name</label>
                      <input
                        type="text"
                        placeholder="E.g. Grilled Chicken, Mojito"
                        value={customMenuItemName}
                        onChange={(e) => setCustomMenuItemName(e.target.value)}
                        className="w-full bg-[#F4F2EE]/40 border border-black/10 px-3 py-2 text-xs rounded-xs focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-black/40 uppercase tracking-wider mb-1">Isolated Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={customMenuItemPrice}
                        onChange={(e) => setCustomMenuItemPrice(e.target.value)}
                        className="w-full bg-[#F4F2EE]/40 border border-black/10 px-3 py-2 text-xs rounded-xs focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-dashed border-stone-100">
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] uppercase font-bold text-black/40">Category:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomMenuItemCategory('Food')}
                          className={`text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 border rounded-xs transition-all ${customMenuItemCategory === 'Food' ? 'bg-black text-white border-black' : 'bg-white text-black/50 border-black/10 hover:border-black/20'}`}
                        >
                          Food
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomMenuItemCategory('Drink')}
                          className={`text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 border rounded-xs transition-all ${customMenuItemCategory === 'Drink' ? 'bg-black text-white border-black' : 'bg-white text-black/50 border-black/10 hover:border-black/20'}`}
                        >
                          Drink
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomMenuItem(false)}
                        className="text-[9px] uppercase tracking-wider font-bold text-black/40 hover:text-black px-2.5 py-1.5"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddNewMenuItem}
                        disabled={!customMenuItemName.trim() || !customMenuItemPrice}
                        className="bg-black hover:bg-black/90 disabled:bg-black/10 text-white text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-xs transition-all"
                      >
                        Save to Menu
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Calculated Amount Summary */}
            <div className="pt-3 border-t border-black/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-black uppercase tracking-wider">Computed Daily Bill Total:</span>
              <span className="font-serif italic text-lg font-bold text-[#1A1A1A]">${amount.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* ==================== 2. PARTY BILL ITEMIZER ENGINE ==================== */}
        {billType === 'party' && (
          <div className="bg-[#F4F2EE]/45 border border-black/5 rounded-xs p-5 md:p-6 space-y-5" id="party-itemizer-engine">
            <div className="pb-2 border-b border-black/5">
              <h3 className="text-[10px] font-bold text-black uppercase tracking-wider">
                Party Bill Line-Item Allocations (Optional)
              </h3>
              <p className="text-[10px] text-black/40 font-sans mt-1">
                Add lines for group items (shared equally) or individual member items. Leftover costs (tip, tax) split evenly.
              </p>
            </div>

            {/* Existing added items */}
            {partyItemSelections.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {partyItemSelections.map(item => {
                  const targetName = item.type === 'individual'
                    ? members.find(m => m.id === item.targetId)?.name || 'Member'
                    : 'Group (Shared)';

                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 bg-white border border-black/5 p-2.5 px-3.5 rounded-xs shadow-3xs text-xs font-sans">
                      <div>
                        <span className="font-bold text-black">{item.name}</span>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-black/40 bg-[#F4F2EE] px-1.5 py-0.5 rounded-2xs border border-black/5 ml-2">
                          {targetName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-serif italic font-semibold">${item.price.toFixed(2)}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePartyItem(item.id)}
                          className="text-black/30 hover:text-rose-600 transition-all p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Line Adder Form */}
            <div className="bg-white border border-black/10 rounded-xs p-4 space-y-3 shadow-2xs">
              <h4 className="text-[10px] font-bold text-black uppercase tracking-wider">Add Party Item Log</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Item Name (e.g. Lobster)"
                  value={newPartyItemName}
                  onChange={(e) => setNewPartyItemName(e.target.value)}
                  className="bg-[#F4F2EE]/40 border border-black/10 px-3 py-2 text-xs rounded-xs focus:bg-white focus:outline-none"
                />
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price ($)"
                  value={newPartyItemPrice}
                  onChange={(e) => setNewPartyItemPrice(e.target.value)}
                  className="bg-[#F4F2EE]/40 border border-black/10 px-3 py-2 text-xs rounded-xs focus:bg-white focus:outline-none"
                />
                <select
                  value={newPartyItemType}
                  onChange={(e) => setNewPartyItemType(e.target.value as any)}
                  className="bg-[#F4F2EE]/40 border border-black/10 px-3 py-2 text-xs rounded-xs focus:bg-white focus:outline-none appearance-none"
                >
                  <option value="group">Group (Split Equal)</option>
                  <option value="individual">Individual Member</option>
                </select>
              </div>

              {/* If individual, select member */}
              {newPartyItemType === 'individual' && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase font-bold text-black/40">Assign to Member:</span>
                  <select
                    value={newPartyItemTargetId}
                    onChange={(e) => setNewPartyItemTargetId(e.target.value)}
                    className="flex-1 bg-[#F4F2EE]/40 border border-black/10 px-3 py-2 text-xs rounded-xs focus:bg-white focus:outline-none"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddPartyItem}
                  disabled={!newPartyItemPrice}
                  className="bg-black hover:bg-black/90 disabled:bg-black/10 text-white text-[9px] uppercase tracking-wider font-bold px-4.5 py-2 rounded-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" /> Add Item Line
                </button>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-black/5 space-y-1.5 text-xs font-sans">
              <div className="flex justify-between text-black/40">
                <span>Itemized Party Total:</span>
                <span>${partyItemSelections.reduce((sum, item) => sum + item.price, 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-black/40">
                <span>Leftover tip/tax (split equally):</span>
                <span>
                  ${Math.max(0, amount - partyItemSelections.reduce((sum, item) => sum + item.price, 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Payers Configuration Panel */}
        <div className="bg-[#F4F2EE]/45 border border-black/5 rounded-xs p-5 md:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/5">
            <h3 className="text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-black/40" />
              Who Paid for this bill?
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-black/40">Multiple payers?</span>
              <button
                type="button"
                onClick={() => setIsMultiPayer(!isMultiPayer)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isMultiPayer ? 'bg-black' : 'bg-black/10'}`}
                id="multi-payer-toggle"
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMultiPayer ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {!isMultiPayer ? (
            <div className="font-sans">
              <select
                value={singlePayerId}
                onChange={(e) => setSinglePayerId(e.target.value)}
                className="w-full bg-white border border-black/10 focus:border-black rounded-xs px-4 py-2.5 text-xs text-[#1A1A1A] transition-all focus:outline-none focus:ring-0 shadow-2xs appearance-none"
                id="single-payer-select"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between gap-3 bg-white p-3 px-4 border border-black/5 rounded-xs shadow-3xs" id={`multi-payer-row-${m.id}`}>
                  <span className="text-xs text-[#1A1A1A] font-bold font-sans">{m.name}</span>
                  <div className="relative w-32 shrink-0">
                    <span className="absolute left-2.5 top-1.5 text-xs text-black/40 font-sans">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={multiPayers[m.id] || ''}
                      onChange={(e) => handlePayerAmountChange(m.id, e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#F4F2EE]/50 border border-black/10 focus:bg-white focus:border-black rounded-xs pl-6 pr-2.5 py-1.5 text-xs text-right font-sans focus:outline-none focus:ring-0 font-medium"
                      id={`multi-payer-input-${m.id}`}
                    />
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold px-2 pt-2 border-t border-black/5 font-sans mt-3">
                <span className="text-black/40">Total payments logged:</span>
                <span className={`${isPayerSumValid ? 'text-black' : 'text-rose-700'}`}>
                  ${totalPaidSum.toFixed(2)} / ${amount.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Splitting Method Panel (Hidden for Daily & Party because splits are computed!) */}
        {billType === 'general' ? (
          <div className="bg-[#F4F2EE]/45 border border-black/5 rounded-xs p-5 md:p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-black/5">
              <h3 className="text-[10px] font-bold text-black uppercase tracking-wider flex items-center gap-2">
                <Split className="w-3.5 h-3.5 text-black/40" />
                Splitting Method
              </h3>
              <div className="inline-flex border border-black/10 bg-white p-0.5 rounded-xs" id="split-type-tabs">
                {(['equal', 'unequal', 'percentage', 'shares'] as SplitType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSplitType(type)}
                    className={`text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-xs transition-all ${splitType === type ? 'bg-black text-white' : 'text-black/40 hover:text-black'}`}
                    id={`split-tab-${type}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Render active split type interface */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 font-sans">
              {splitType === 'equal' && (
                <div className="space-y-2">
                  <p className="text-[10px] text-black/40 font-sans mb-3 leading-relaxed">Check the members who share this expense. Default distribution is even.</p>
                  {members.map(m => {
                    const isChecked = (splits[m.id] || 0) > 0;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleToggleEqualParticipant(m.id)}
                        className={`w-full flex items-center justify-between p-3 px-4 border border-black/5 rounded-xs bg-white text-left transition-all shadow-3xs ${isChecked ? 'ring-1 ring-black border-black/15' : 'opacity-60'}`}
                        id={`equal-row-${m.id}`}
                      >
                        <span className="text-xs font-bold text-[#1A1A1A]">{m.name}</span>
                        <div className={`w-4 h-4 rounded-xs border flex items-center justify-center transition-all ${isChecked ? 'bg-black border-black text-white' : 'border-black/20'}`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {splitType === 'unequal' && (
                <div className="space-y-2.5">
                  <p className="text-[10px] text-black/40 mb-3 leading-relaxed">Assign exact dollar splits. Combined values must sum to ${amount.toFixed(2)}.</p>
                  {members.map(m => (
                    <div key={m.id} className="flex items-center justify-between gap-3 bg-white p-3 px-4 border border-black/5 rounded-xs shadow-3xs" id={`unequal-row-${m.id}`}>
                      <span className="text-xs text-[#1A1A1A] font-bold">{m.name}</span>
                      <div className="relative w-32 shrink-0">
                        <span className="absolute left-2.5 top-1.5 text-xs text-black/40">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={splits[m.id] || ''}
                          onChange={(e) => handleSplitValueChange(m.id, e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#F4F2EE]/50 border border-black/10 focus:bg-white focus:border-black rounded-xs pl-6 pr-2.5 py-1.5 text-xs text-right font-sans focus:outline-none focus:ring-0 font-medium"
                          id={`unequal-input-${m.id}`}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold px-2 pt-2 border-t border-black/5 mt-3">
                    <span className="text-black/40">Total split sums:</span>
                    <span className={`${Math.abs(totalOwedSum() - amount) < 0.01 ? 'text-black' : 'text-rose-700'}`}>
                      ${totalOwedSum().toFixed(2)} / ${amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {splitType === 'percentage' && (
                <div className="space-y-2.5">
                  <p className="text-[10px] text-black/40 mb-3 leading-relaxed">Assign percentage ratios. Combined values must equal 100%.</p>
                  {members.map(m => {
                    const calculatedOwed = (amount * (splits[m.id] || 0)) / 100;
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 bg-white p-3 px-4 border border-black/5 rounded-xs shadow-3xs" id={`percentage-row-${m.id}`}>
                        <div>
                          <span className="text-xs text-[#1A1A1A] font-bold">{m.name}</span>
                          <span className="text-[10px] text-black/40 ml-2 font-serif italic">(${calculatedOwed.toFixed(2)})</span>
                        </div>
                        <div className="relative w-32 shrink-0">
                          <span className="absolute right-2.5 top-1.5 text-xs text-black/40">%</span>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={splits[m.id] || ''}
                            onChange={(e) => handleSplitValueChange(m.id, e.target.value)}
                            placeholder="0"
                            className="w-full bg-[#F4F2EE]/50 border border-black/10 focus:bg-white focus:border-black rounded-xs pl-3 pr-7 py-1.5 text-xs text-right font-sans focus:outline-none focus:ring-0 font-medium"
                            id={`percentage-input-${m.id}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold px-2 pt-2 border-t border-black/5 mt-3">
                    <span className="text-black/40">Total percentage allocated:</span>
                    <span className={`${Math.abs(totalOwedSum() - 100) < 0.01 ? 'text-black' : 'text-rose-700'}`}>
                      {totalOwedSum().toFixed(1)}% / 100%
                    </span>
                  </div>
                </div>
              )}

              {splitType === 'shares' && (
                <div className="space-y-2.5">
                  <p className="text-[10px] text-black/40 mb-3 leading-relaxed">Assign relative share counts. Ledger balances split proportionally.</p>
                  {members.map(m => {
                    const totalShares = Object.values(splits).reduce((sum: number, val: number) => sum + (val || 0), 0) as number;
                    const memberShare = (splits[m.id] || 0) as number;
                    const calculatedOwed = totalShares > 0 ? (amount * memberShare) / totalShares : 0;
                    return (
                      <div key={m.id} className="flex items-center justify-between gap-3 bg-white p-3 px-4 border border-black/5 rounded-xs shadow-3xs" id={`shares-row-${m.id}`}>
                        <div>
                          <span className="text-xs text-[#1A1A1A] font-bold">{m.name}</span>
                          <span className="text-[10px] text-black/40 ml-2 font-serif italic">(${calculatedOwed.toFixed(2)})</span>
                        </div>
                        <div className="relative w-32 shrink-0">
                          <span className="absolute right-2.5 top-1.5 text-xs text-black/40 font-sans">shares</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={splits[m.id] || ''}
                            onChange={(e) => handleSplitValueChange(m.id, e.target.value)}
                            placeholder="0"
                            className="w-full bg-[#F4F2EE]/50 border border-black/10 focus:bg-white focus:border-black rounded-xs pl-3 pr-12 py-1.5 text-xs text-right font-sans focus:outline-none focus:ring-0 font-medium"
                            id={`shares-input-${m.id}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-end text-[10px] uppercase tracking-wider font-bold px-2 pt-2">
                    <span className="text-black/40">Total Shares: {totalOwedSum()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Derived Split Previews for Daily & Party Bills */
          <div className="bg-[#F4F2EE]/45 border border-black/5 rounded-xs p-5 md:p-6 shadow-2xs">
            <h3 className="text-[10px] font-bold text-black uppercase tracking-wider mb-4 pb-2 border-b border-black/5 flex items-center gap-1.5">
              <Split className="w-3.5 h-3.5 text-black/40" />
              Real-time Calculated Individual Cost Shares
            </h3>
            <div className="space-y-2.5">
              {members.map(m => {
                const shareAmount = splits[m.id] || 0;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 px-4 border border-black/5 rounded-xs bg-white text-xs font-sans shadow-3xs">
                    <span className="font-bold text-[#1A1A1A]">{m.name}</span>
                    <span className="font-serif italic font-bold text-black">${shareAmount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes (Optional) */}
        <div>
          <label className="block text-[9px] font-bold text-black/40 uppercase tracking-[0.2em] mb-1.5">Note (Optional)</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add comments, location, or receipts detail"
            className="w-full bg-white border border-black/10 focus:border-black rounded-xs px-4 py-2.5 text-xs text-[#1A1A1A] transition-all font-sans focus:outline-none focus:ring-0 shadow-2xs"
            id="expense-note-input"
          />
        </div>

        {/* Bill / Receipt Image Attachment */}
        <div className="space-y-1.5" id="bill-attachment-container">
          <label className="block text-[9px] font-bold text-black/40 uppercase tracking-[0.2em]">Bill / Receipt Attachment</label>
          {billImage ? (
            <div className="relative inline-block rounded-xs overflow-hidden border border-black/10 bg-[#F4F2EE]/30 p-2">
              <img src={billImage} alt="Receipt preview" className="max-h-48 rounded-xs object-contain" referrerPolicy="no-referrer" />
              <button
                type="button"
                onClick={() => setBillImage('')}
                className="absolute top-3.5 right-3.5 bg-black hover:bg-black/80 text-white p-1 rounded-full transition-all shadow-xs"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border border-dashed border-black/10 hover:border-black/25 rounded-xs p-5 text-center bg-[#F4F2EE]/20 hover:bg-[#F4F2EE]/30 transition-all cursor-pointer relative"
              id="drag-drop-zone"
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="expense-image-upload"
              />
              <div className="flex flex-col items-center justify-center gap-1.5">
                <Upload className="w-5 h-5 text-black/30" />
                <span className="text-xs text-black/60 font-medium">Upload receipt / bill image</span>
                <span className="text-[9px] text-black/40 uppercase tracking-wider font-bold">Drag & drop or click to choose file</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit action */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-black/5">
          {onCancel && (
            <button
              onClick={onCancel}
              type="button"
              className="text-[9px] uppercase tracking-wider font-bold text-black/50 hover:text-black px-4 py-2"
              id="expense-form-cancel"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={amount <= 0 || !description.trim() || !isPayerSumValid || !isSplitSumValid()}
            className="inline-flex items-center justify-center gap-2 bg-black hover:bg-black/90 text-white disabled:bg-black/10 disabled:text-black/30 disabled:cursor-not-allowed font-bold text-[10px] uppercase tracking-[0.18em] px-6 py-3 rounded-xs transition-all shadow-md"
            id="expense-form-submit"
          >
            <Plus className="w-3.5 h-3.5" />
            {editingExpense ? 'Save Changes' : 'Record Expense'}
          </button>
        </div>
      </form>
    </div>
  );
}
