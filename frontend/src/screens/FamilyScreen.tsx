import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Copy,
  Check,
  Heart,
  Droplets,
  Footprints,
  Pill,
  Lock,
  BellRing,
  Trash2,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { FamilySharingPermissions } from '../types';

export const FamilyScreen: React.FC = () => {
  const { family, user, joinFamilyWithCode, deleteFamilyMember, addFamilyMember, language, t } = useHealth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<any | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Mother');

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleJoinFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    const success = joinFamilyWithCode(joinCodeInput.trim());
    if (success) {
      setJoinSuccess(`Successfully connected to circle: ${joinCodeInput.toUpperCase()}`);
      setTimeout(() => {
        setJoinSuccess(null);
        setShowJoinModal(false);
      }, 1500);
    }
  };

  const handleSendTabletNudge = (memberName: string, tabletName: string) => {
    const msg = `Sent a gentle tablet reminder to ${memberName} to take ${tabletName}!`;
    setNudgeMessage(msg);
    setTimeout(() => setNudgeMessage(null), 3000);
  };

  const confirmDeleteMember = () => {
    if (!memberToDelete) return;
    const name = memberToDelete.name;
    deleteFamilyMember(memberToDelete.userId);
    setMemberToDelete(null);
    setNudgeMessage(`${name} has been removed from your family circle.`);
    setTimeout(() => setNudgeMessage(null), 3000);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const generatedUserCode = `HL-${randomCode}`;

    addFamilyMember({
      name: newMemberName.trim(),
      relationship: newMemberRole,
      userFamilyCode: generatedUserCode,
      avatarColor: newMemberRole === 'Mother' ? '#059669' : '#0d9488',
      medsTaken: 1,
      medsTotal: 1,
      tabletsList: [
        { name: 'Multivitamin', dose: '1 Tablet', scheduledTime: '09:00 AM', status: 'taken' }
      ]
    });

    setNudgeMessage(`${newMemberName} connected with unique code ${generatedUserCode}!`);
    setTimeout(() => setNudgeMessage(null), 3000);
    setShowAddMemberModal(false);
    setNewMemberName('');
  };

  return (
    <div className="space-y-4 pb-4 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{family.name}</h2>
          <p className="text-xs text-slate-500 font-medium">
            Monitor daily medicines and health activity for your family members
          </p>
        </div>
        <button
          onClick={() => setShowJoinModal(true)}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Connect Circle</span>
        </button>
      </div>

      {/* Gentle Nudge Toast */}
      {nudgeMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg border border-slate-700 animate-fade-in flex items-center space-x-2">
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          <span>{nudgeMessage}</span>
        </div>
      )}

      {/* Clean Apple Fitness Style: Individual User Codes Hero */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
              <Key className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">Your Personal Family Code</h3>
              <p className="text-[11px] text-slate-500">Each family member has their own unique code for direct pairing</p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
            Unique to You
          </span>
        </div>

        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
          <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
            {user.familyCode || 'HL-9204'}
          </span>
          <button
            onClick={() => copyCode(user.familyCode || 'HL-9204')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs active:scale-95 transition-all"
          >
            {copiedCode === (user.familyCode || 'HL-9204') ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode === (user.familyCode || 'HL-9204') ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Family Members List with Prominently Highlighted Tablet Intake */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Family Members ({family.members.length + 1})
          </h3>
          <button
            onClick={() => setShowAddMemberModal(true)}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center space-x-1 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200 shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Member</span>
          </button>
        </div>

        {/* Current User Card */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                {user.name?.[0] || 'Y'}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-slate-900 text-base">{user.name} (You)</h4>
                  <span className="text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md">
                    Admin
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                  <span>Connect Code:</span>
                  <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                    {user.familyCode || 'HL-9204'}
                  </span>
                </div>
              </div>
            </div>

            {/* User Medicine Intake Pill */}
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center space-x-1.5">
              <Pill className="w-3.5 h-3.5 text-emerald-600" />
              <span>2/2 Medicines Taken ✓</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center pt-1">
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Today's Steps</span>
              <span className="text-sm font-bold text-slate-900">8,420 steps</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">Water Intake</span>
              <span className="text-sm font-bold text-slate-900">1.5 Liters</span>
            </div>
          </div>
        </div>

        {/* Connected Family Members (Father, Mother) */}
        {family.members.map(member => {
          const isAllTabletsTaken = member.medsTaken === member.medsTotal;
          const memberCode = member.userFamilyCode || 'HL-5819';

          return (
            <div
              key={member.userId}
              className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-all"
            >
              {/* Top Row: Info + Unique User Code */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-slate-900 text-base">{member.name}</h4>
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                        {member.relationship}
                      </span>
                    </div>

                    {/* Member's Unique Personal Family Code */}
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                      <span>Unique Code:</span>
                      <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {memberCode}
                      </span>
                      <button
                        onClick={() => copyCode(memberCode)}
                        className="text-[10px] font-bold text-teal-700 hover:text-teal-900 underline ml-1"
                      >
                        {copiedCode === memberCode ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setMemberToDelete(member)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all active:scale-95"
                  title="Remove from Family Circle"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* HIGHLIGHTED MEDICINE INTAKE SECTION */}
              <div className={`p-4 rounded-2xl border ${
                isAllTabletsTaken
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Pill className={`w-4 h-4 ${isAllTabletsTaken ? 'text-emerald-700' : 'text-amber-700'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Daily Medicine Intake
                    </span>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    isAllTabletsTaken
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-900 border-amber-300'
                  }`}>
                    {member.medsTaken} of {member.medsTotal} Medicines Taken {isAllTabletsTaken ? '✓' : '(Action Needed)'}
                  </span>
                </div>

                {/* Detailed Medicine Breakdown for this Member */}
                <div className="space-y-1.5 pt-1">
                  {(member.tabletsList || [
                    { name: 'Daily Medicine 1', dose: '1 Dose', scheduledTime: 'Morning', status: 'taken' as const },
                    { name: 'Daily Medicine 2', dose: '1 Dose', scheduledTime: 'Night', status: isAllTabletsTaken ? ('taken' as const) : ('pending' as const) }
                  ]).map((tab, idx) => (
                    <div
                      key={idx}
                      className="bg-white/80 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${tab.status === 'taken' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="font-bold text-slate-900">{tab.name}</span>
                        <span className="text-slate-500">({tab.dose})</span>
                        <span className="text-slate-400">• {tab.scheduledTime}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`font-bold text-[11px] ${tab.status === 'taken' ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {tab.status === 'taken' ? 'Taken ✓' : 'Pending ⏳'}
                        </span>
                        {tab.status === 'pending' && (
                          <button
                            onClick={() => handleSendTabletNudge(member.name, tab.name)}
                            className="px-2 py-0.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] active:scale-95 shadow-xs transition"
                          >
                            Nudge
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps and Water Summary */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Activity</span>
                  <span className="font-bold text-slate-900">{member.stepsToday.toLocaleString()} steps</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase">Water Intake</span>
                  <span className="font-bold text-slate-900">{member.waterPercent}% Reached</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Join Family Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-3.5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">Enter User Family Code</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJoinFamily} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Family Member's Unique Connect Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HL-5819"
                  value={joinCodeInput}
                  onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-mono uppercase focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              {joinSuccess && (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-center">
                  {joinSuccess}
                </p>
              )}

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Connect Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-3.5 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">Add Family Member</h3>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh (Brother)"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Relationship</label>
                <select
                  value={newMemberRole}
                  onChange={e => setNewMemberRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white"
                >
                  <option value="Father">Father</option>
                  <option value="Mother">Mother</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Sibling">Sibling / Brother / Sister</option>
                  <option value="Child">Child</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs active:scale-95"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full p-5 space-y-3 animate-scale-up">
            <h3 className="text-sm font-bold text-slate-900">Remove Family Member?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong>{memberToDelete.name}</strong> from your family circle?
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setMemberToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMember}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs active:scale-95"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
