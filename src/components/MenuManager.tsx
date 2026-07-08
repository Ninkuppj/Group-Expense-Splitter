import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Utensils, Coffee, DollarSign, HelpCircle } from 'lucide-react';
import { MenuItem } from '../types';

interface MenuManagerProps {
  customMenu: MenuItem[];
  onUpdateMenu: (menu: MenuItem[]) => void;
}

export default function MenuManager({ customMenu, onUpdateMenu }: MenuManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<'Food' | 'Drink'>('Food');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState<'Food' | 'Drink'>('Food');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) return;

    const newItem: MenuItem = {
      id: 'menu-' + crypto.randomUUID(),
      name: name.trim(),
      price: parsedPrice,
      category
    };

    const updatedMenu = [...customMenu, newItem];
    onUpdateMenu(updatedMenu);

    // Reset fields
    setName('');
    setPrice('');
    setCategory('Food');
    setIsAdding(false);
  };

  const handleDeleteItem = (id: string) => {
    const updatedMenu = customMenu.filter(item => item.id !== id);
    onUpdateMenu(updatedMenu);
  };

  const handleStartEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.price.toString());
    setEditCategory(item.category as 'Food' | 'Drink' || 'Food');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim() || !editPrice) return;

    const parsedPrice = parseFloat(editPrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) return;

    const updatedMenu = customMenu.map(item => {
      if (item.id === id) {
        return {
          ...item,
          name: editName.trim(),
          price: parsedPrice,
          category: editCategory
        };
      }
      return item;
    });

    onUpdateMenu(updatedMenu);
    setEditingId(null);
  };

  const loadTemplate = (type: 'cafe' | 'pub' | 'restaurant') => {
    let items: MenuItem[] = [];
    if (type === 'cafe') {
      items = [
        { id: 'c-1', name: 'Espresso', price: 35000, category: 'Drink' },
        { id: 'c-2', name: 'Croissant', price: 45000, category: 'Food' },
        { id: 'c-3', name: 'Iced Latte', price: 55000, category: 'Drink' },
        { id: 'c-4', name: 'Avocado Toast', price: 115000, category: 'Food' },
        { id: 'c-5', name: 'Blueberry Muffin', price: 40000, category: 'Food' },
      ];
    } else if (type === 'pub') {
      items = [
        { id: 'p-1', name: 'Craft Beer Pint', price: 85000, category: 'Drink' },
        { id: 'p-2', name: 'Buffalo Wings', price: 140000, category: 'Food' },
        { id: 'p-3', name: 'Classic Burger', price: 165000, category: 'Food' },
        { id: 'p-4', name: 'Irish Stout', price: 95000, category: 'Drink' },
        { id: 'p-5', name: 'French Fries', price: 75000, category: 'Food' },
      ];
    } else if (type === 'restaurant') {
      items = [
        { id: 'r-1', name: 'Steak Frites', price: 320000, category: 'Food' },
        { id: 'r-2', name: 'House Red Wine', price: 120000, category: 'Drink' },
        { id: 'r-3', name: 'Truffle Pasta', price: 245000, category: 'Food' },
        { id: 'r-4', name: 'Caesar Salad', price: 135000, category: 'Food' },
        { id: 'r-5', name: 'Sparkling Water', price: 45000, category: 'Drink' },
      ];
    }
    onUpdateMenu(items);
  };

  const foods = customMenu.filter(item => item.category.toLowerCase() !== 'drink');
  const drinks = customMenu.filter(item => item.category.toLowerCase() === 'drink');

  return (
    <div className="space-y-8" id="menu-manager-view">
      {/* Overview Intro Card */}
      <div className="bg-[#1A1A1A] text-white rounded-xs p-6 md:p-8 shadow-lg font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-[10px] font-bold text-[#D2C9B9] uppercase tracking-[0.25em] block mb-1">Custom Group Menu</span>
            <h3 className="font-serif italic text-3xl text-white">Configure Plate Selections</h3>
            <p className="text-white/50 text-xs mt-2 max-w-xl">
              Populating this menu enables rapid "single-plate" food and drink calculations. Members can be selected as consumers with isolated prices instantly.
            </p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-white text-black hover:bg-stone-100 font-bold text-[10px] uppercase tracking-[0.18em] px-5 py-3 rounded-xs shrink-0 transition-all flex items-center gap-1.5"
            id="toggle-add-menu-item-btn"
          >
            {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isAdding ? 'Close Form' : 'Add Menu Item'}</span>
          </button>
        </div>
      </div>

      {/* Add New Item Form */}
      {isAdding && (
        <form onSubmit={handleAddItem} className="bg-white border border-black/10 rounded-xs p-6 shadow-sm space-y-4" id="add-menu-item-form">
          <h4 className="text-[10px] font-bold text-black uppercase tracking-wider pb-2 border-b border-black/5">Add New Menu Item</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-black/40 uppercase tracking-wider mb-1.5">Item Name</label>
              <input
                type="text"
                placeholder="E.g. Margherita Pizza, Mojito"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F4F2EE]/50 border border-black/10 hover:border-black/20 px-3 py-2 text-xs rounded-xs focus:bg-white focus:outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-black/40 uppercase tracking-wider mb-1.5">Price (₫)</label>
              <input
                type="number"
                step="1"
                min="1"
                placeholder="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-[#F4F2EE]/50 border border-black/10 hover:border-black/20 px-3 py-2 text-xs rounded-xs focus:bg-white focus:outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-black/40 uppercase tracking-wider mb-1.5">Category</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('Food')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border rounded-xs transition-all ${category === 'Food' ? 'bg-black text-white border-black shadow-xs' : 'bg-white text-black/50 border-black/10 hover:border-black/20'}`}
                >
                  Food
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('Drink')}
                  className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border rounded-xs transition-all ${category === 'Drink' ? 'bg-black text-white border-black shadow-xs' : 'bg-white text-black/50 border-black/10 hover:border-black/20'}`}
                >
                  Drink
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-black/[0.04]">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[9px] uppercase tracking-wider font-bold text-black/40 hover:text-black px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !price}
              className="bg-black text-white hover:bg-black/90 disabled:bg-black/10 disabled:text-black/30 font-bold text-[9px] uppercase tracking-wider px-5 py-2.5 rounded-xs transition-all"
            >
              Add to Menu
            </button>
          </div>
        </form>
      )}

      {/* Preset Templates Selector when menu is empty */}
      {customMenu.length === 0 && (
        <div className="bg-[#F4F2EE]/45 border border-dashed border-black/15 rounded-xs p-8 text-center space-y-4" id="menu-empty-state">
          <HelpCircle className="w-10 h-10 text-black/25 mx-auto" />
          <div>
            <h4 className="font-serif italic text-lg text-black">Your group menu is currently empty</h4>
            <p className="text-black/50 text-xs mt-1">Start adding dishes manually above, or select one of our template presets to get started immediately.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              onClick={() => loadTemplate('cafe')}
              className="bg-white border border-black/10 hover:border-black/20 px-4 py-2 rounded-xs text-xs font-semibold text-black transition-all shadow-3xs"
            >
              ☕ Cafe &amp; Bakery Preset
            </button>
            <button
              onClick={() => loadTemplate('pub')}
              className="bg-white border border-black/10 hover:border-black/20 px-4 py-2 rounded-xs text-xs font-semibold text-black transition-all shadow-3xs"
            >
              🍔 Pub &amp; Grill Preset
            </button>
            <button
              onClick={() => loadTemplate('restaurant')}
              className="bg-white border border-black/10 hover:border-black/20 px-4 py-2 rounded-xs text-xs font-semibold text-black transition-all shadow-3xs"
            >
              🍝 Bistro Restaurant Preset
            </button>
          </div>
        </div>
      )}

      {/* Menu List Columns */}
      {customMenu.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="menu-categorized-lists">
          {/* Foods Section */}
          <div className="bg-white border border-black/5 rounded-xs p-6 shadow-sm">
            <h4 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mb-4 pb-2 border-b border-black/5 flex items-center gap-2">
              <Utensils className="w-4 h-4 text-stone-500" />
              <span>Food Items ({foods.length})</span>
            </h4>

            {foods.length === 0 ? (
              <p className="text-xs text-black/30 italic py-4">No food items defined yet.</p>
            ) : (
              <div className="space-y-3">
                {foods.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-3 border border-black/[0.03] rounded-xs bg-[#F9F7F2]/35">
                    {editingId === item.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-white border border-black/10 px-2 py-1 text-xs rounded-xs"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-20 bg-white border border-black/10 px-2 py-1 text-xs rounded-xs text-right"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditCategory('Food')}
                              className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 border rounded-xs ${editCategory === 'Food' ? 'bg-black text-white border-black' : 'bg-white text-black/40 border-black/10'}`}
                            >
                              Food
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditCategory('Drink')}
                              className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 border rounded-xs ${editCategory === 'Drink' ? 'bg-black text-white border-black' : 'bg-white text-black/40 border-black/10'}`}
                            >
                              Drink
                            </button>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={handleCancelEdit} className="p-1 hover:bg-black/5 rounded-xs text-black/40 hover:text-black">
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleSaveEdit(item.id)} className="p-1 hover:bg-black/5 rounded-xs text-emerald-600">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-black block truncate">{item.name}</span>
                          <span className="text-[10px] text-black/40 font-mono">ID: {item.id}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-serif italic font-bold text-stone-800 text-sm">{Math.round(item.price).toLocaleString('vi-VN')} ₫</span>
                          <div className="flex gap-1 border-l border-black/5 pl-3">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 hover:bg-black/5 text-black/40 hover:text-black rounded-xs transition-all"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 hover:bg-rose-50 text-black/40 hover:text-rose-600 rounded-xs transition-all"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drinks Section */}
          <div className="bg-white border border-black/5 rounded-xs p-6 shadow-sm">
            <h4 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] mb-4 pb-2 border-b border-black/5 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-stone-500" />
              <span>Drink Items ({drinks.length})</span>
            </h4>

            {drinks.length === 0 ? (
              <p className="text-xs text-black/30 italic py-4">No drink items defined yet.</p>
            ) : (
              <div className="space-y-3">
                {drinks.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-3 border border-black/[0.03] rounded-xs bg-[#F9F7F2]/35">
                    {editingId === item.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 bg-white border border-black/10 px-2 py-1 text-xs rounded-xs"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                            className="w-20 bg-white border border-black/10 px-2 py-1 text-xs rounded-xs text-right"
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditCategory('Food')}
                              className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 border rounded-xs ${editCategory === 'Food' ? 'bg-black text-white border-black' : 'bg-white text-black/40 border-black/10'}`}
                            >
                              Food
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditCategory('Drink')}
                              className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 border rounded-xs ${editCategory === 'Drink' ? 'bg-black text-white border-black' : 'bg-white text-black/40 border-black/10'}`}
                            >
                              Drink
                            </button>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={handleCancelEdit} className="p-1 hover:bg-black/5 rounded-xs text-black/40 hover:text-black">
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleSaveEdit(item.id)} className="p-1 hover:bg-black/5 rounded-xs text-emerald-600">
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-0">
                          <span className="font-bold text-xs text-black block truncate">{item.name}</span>
                          <span className="text-[10px] text-black/40 font-mono">ID: {item.id}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-serif italic font-bold text-stone-800 text-sm">{Math.round(item.price).toLocaleString('vi-VN')} ₫</span>
                          <div className="flex gap-1 border-l border-l-black/5 pl-3">
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1.5 hover:bg-black/5 text-black/40 hover:text-black rounded-xs transition-all"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 hover:bg-rose-50 text-black/40 hover:text-rose-600 rounded-xs transition-all"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
