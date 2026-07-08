import React, { useState, useMemo } from 'react';
import { Users, Plus, Check, ChevronRight, UserPlus, Trash2, Mail } from 'lucide-react';
import { Group, Member, AVATAR_COLORS } from '../types';

interface GroupListProps {
  groups: Group[];
  activeGroupId: string | null;
  onSelectGroup: (id: string) => void;
  onCreateGroup: (name: string, description: string, initialMembers?: Omit<Member, 'id'>[]) => void;
  onAddMember: (groupId: string, name: string, phone?: string) => void;
  onDeleteGroup: (id: string) => void;
}

export default function GroupList({
  groups,
  activeGroupId,
  onSelectGroup,
  onCreateGroup,
  onAddMember,
  onDeleteGroup
}: GroupListProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedExistingMembers, setSelectedExistingMembers] = useState<{ name: string; phone?: string; avatarColor?: string }[]>([]);

  // Add Member State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  // Find all unique existing members in the system across all groups
  const allExistingMembers = useMemo(() => {
    const map = new Map<string, { name: string; phone?: string; avatarColor?: string }>();
    groups.forEach(g => {
      g.members.forEach(m => {
        const normalized = m.name.trim().toLowerCase();
        if (
          normalized === 'you (me)' ||
          normalized === 'you' ||
          m.id === 'm_me' ||
          m.id === 'm_owner'
        ) {
          return;
        }
        const key = `${m.name.trim().toLowerCase()}__${m.phone?.trim() || ''}`;
        if (!map.has(key)) {
          map.set(key, {
            name: m.name,
            phone: m.phone || undefined,
            avatarColor: m.avatarColor || undefined
          });
        }
      });
    });
    return Array.from(map.values());
  }, [groups]);

  const handleCreateGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    onCreateGroup(newGroupName.trim(), newGroupDesc.trim(), selectedExistingMembers);
    setNewGroupName('');
    setNewGroupDesc('');
    setSelectedExistingMembers([]);
    setIsCreating(false);
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !activeGroupId) return;
    onAddMember(activeGroupId, newMemberName.trim(), newMemberPhone.trim() || undefined);
    setNewMemberName('');
    setNewMemberPhone('');
    setIsAddingMember(false);
  };

  return (
    <div className="space-y-6 font-sans" id="groups-side-panel">
      {/* 1. Group Selector Card */}
      <div className="bg-white rounded-xs border border-black/5 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/5">
          <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-black/40" />
            Your Groups
          </h3>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center gap-1 text-[9px] text-black bg-[#F4F2EE] hover:bg-black/5 font-bold border border-black/10 px-2.5 py-1 rounded-xs uppercase tracking-wider transition-all"
              id="show-create-group-btn"
            >
              <Plus className="w-3 h-3" />
              New
            </button>
          )}
        </div>

        {isCreating ? (
          <form onSubmit={handleCreateGroupSubmit} className="space-y-3 p-4 bg-[#F4F2EE] rounded-xs border border-black/5 mb-4" id="create-group-form">
            <h4 className="text-[10px] font-bold text-black uppercase tracking-wider">Create New Group</h4>
            <div>
              <input
                type="text"
                required
                placeholder="Group Name (e.g. Ski Trip)"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full bg-white border border-black/10 focus:border-black rounded-xs px-3 py-2 text-xs text-black transition-all shadow-2xs focus:outline-none focus:ring-0"
                id="group-name-input"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Description (Optional)"
                value={newGroupDesc}
                onChange={(e) => setNewGroupDesc(e.target.value)}
                className="w-full bg-white border border-black/10 focus:border-black rounded-xs px-3 py-2 text-xs text-black transition-all shadow-2xs focus:outline-none focus:ring-0"
                id="group-desc-input"
              />
            </div>

            {allExistingMembers.length > 0 && (
              <div className="space-y-1.5 pt-1.5 border-t border-black/5">
                <label className="block text-[8px] font-bold text-black/40 uppercase tracking-wider">Quick-add Existing Members</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white border border-black/5 rounded-xs shadow-3xs">
                  {allExistingMembers.map((member, index) => {
                    const isSelected = selectedExistingMembers.some(
                      sm => sm.name.toLowerCase() === member.name.toLowerCase() && sm.phone === member.phone
                    );
                    return (
                      <button
                        type="button"
                        key={index}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedExistingMembers(prev => prev.filter(
                              sm => !(sm.name.toLowerCase() === member.name.toLowerCase() && sm.phone === member.phone)
                            ));
                          } else {
                            setSelectedExistingMembers(prev => [...prev, member]);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#A3E635]/20 border-[#4D7C0F] text-[#3F6212]'
                            : 'bg-stone-50 border-black/10 text-black/60 hover:border-black/30'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-[#4D7C0F] shrink-0" />}
                        <span className="truncate max-w-[80px]">{member.name}</span>
                        {member.phone && <span className="text-[8px] text-black/30">({member.phone.slice(-3)})</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setSelectedExistingMembers([]);
                }}
                className="text-[9px] uppercase tracking-wider font-bold text-black/50 hover:text-black px-2 py-1.5"
                id="cancel-group-btn"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newGroupName.trim()}
                className="bg-black hover:bg-black/90 disabled:bg-black/10 text-white text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-xs transition-all"
                id="submit-group-btn"
              >
                Create
              </button>
            </div>
          </form>
        ) : null}

        {/* List of groups */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {groups.map(group => {
            const isActive = group.id === activeGroupId;
            const totalSpend = group.expenses.reduce((sum, e) => sum + e.amount, 0);

            return (
              <div
                key={group.id}
                className={`group flex items-center justify-between gap-3 p-3.5 px-4 rounded-xs border cursor-pointer transition-all ${isActive ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white shadow-md' : 'bg-white border-black/5 hover:border-black/15 text-[#1A1A1A]'}`}
                onClick={() => onSelectGroup(group.id)}
                id={`group-item-${group.id}`}
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-sm tracking-tight">{group.name}</h4>
                  <p className={`text-[10px] tracking-wider uppercase font-semibold mt-0.5 ${isActive ? 'text-white/60' : 'text-black/40'}`}>
                    {group.members.length} members • {Math.round(totalSpend).toLocaleString('vi-VN')} ₫
                  </p>
                </div>
                
                <div className="flex items-center gap-1 shrink-0">
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'text-white/60 translate-x-0.5' : 'text-black/30'}`} />
                  {groups.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGroup(group.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-1 rounded-xs transition-all ${isActive ? 'hover:bg-white/10 text-white/40 hover:text-rose-300' : 'hover:bg-black/5 text-black/30 hover:text-rose-600'}`}
                      title="Delete Group"
                      id={`delete-group-btn-${group.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Active Group Members Deck Card */}
      {activeGroup && (
        <div className="bg-white rounded-xs border border-black/5 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-black/5">
            <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em] flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-black/40" />
              <span>Members ({activeGroup.members.length})</span>
            </h3>
            {!isAddingMember && (
              <button
                onClick={() => setIsAddingMember(true)}
                className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-black bg-[#F4F2EE] hover:bg-black/5 font-bold border border-black/10 px-2.5 py-1 rounded-xs transition-all"
                id="show-add-member-btn"
              >
                <UserPlus className="w-3 h-3" />
                Add
              </button>
            )}
          </div>

          {isAddingMember ? (
            <form onSubmit={handleAddMemberSubmit} className="space-y-3 p-4 bg-[#F4F2EE] rounded-xs border border-black/5 mb-4" id="add-member-form">
              <h4 className="text-[10px] font-bold text-black uppercase tracking-wider">Add New Member</h4>
              <div>
                <input
                  type="text"
                  required
                  placeholder="Full Name (e.g. Alice)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full bg-white border border-black/10 focus:border-black rounded-xs px-3 py-2 text-xs text-black transition-all shadow-2xs focus:outline-none focus:ring-0"
                  id="member-name-input"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Phone (for MoMo, e.g. 0912345678)"
                  value={newMemberPhone}
                  onChange={(e) => setNewMemberPhone(e.target.value)}
                  className="w-full bg-white border border-black/10 focus:border-black rounded-xs px-3 py-2 text-xs text-black transition-all shadow-2xs focus:outline-none focus:ring-0"
                  id="member-phone-input"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingMember(false)}
                  className="text-[9px] uppercase tracking-wider font-bold text-black/50 hover:text-black px-2 py-1.5"
                  id="cancel-member-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newMemberName.trim()}
                  className="bg-black hover:bg-black/90 disabled:bg-black/10 text-white text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-xs transition-all"
                  id="submit-member-btn"
                >
                  Add
                </button>
              </div>
            </form>
          ) : null}

          {/* Members list with initials in Lora serif styling */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {activeGroup.members.map(member => {
              const initials = member.name
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <div key={member.id} className="flex items-center justify-between gap-3 bg-[#F4F2EE]/40 border border-black/5 p-3 rounded-xs" id={`member-row-${member.id}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full border border-black/10 bg-[#F4F2EE] text-[#1A1A1A] text-[11px] font-serif italic flex items-center justify-center shrink-0 shadow-2xs">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-[#1A1A1A] truncate">{member.name}</p>
                      {member.phone && (
                        <p className="text-[10px] text-[#1A1A1A]/50 flex items-center gap-1 truncate font-medium mt-0.5">
                          <span className="bg-[#A3E635]/20 text-[#3F6212] px-1 py-0.5 rounded-[2px] font-bold text-[8px] tracking-wider uppercase">MoMo</span>
                          {member.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
