import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Activity,
  Utensils,
  Pill,
  Users,
  FileText,
  Shield,
  LogOut,
  AlertTriangle,
  Footprints,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Check,
  X,
  Sparkles,
  Home,
  User,
  BarChart3,
  Download,
  Settings
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';

// PWA Install Prompt Hook
export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return { isInstallable, installApp };
}

export const APP_BRAND_NAME = 'Helyra AI';
export const APP_TAGLINE = 'Adaptive Family Health Companion';

interface NavigationProps {
  onOpenSOS?: () => void;
}

export const TopBar: React.FC<NavigationProps> = ({ onOpenSOS }) => {
  const { user, todayStats, activeScreen, setActiveScreen, logout, language, setLanguage, brandName, setBrandName } = useHealth();
  const { isInstallable, installApp } = usePWAInstallPrompt();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [inputName, setInputName] = useState(brandName || 'Helyra AI');

  const presetNames = [
    { name: 'Helyra AI', descEn: 'Adaptive Family Health Companion', descTa: 'தகவமைக்கும் குடும்ப நல உதவியாளர்' },
    { name: 'VITALIS', descEn: 'Adaptive Vitality & Health', descTa: 'ஆரோக்கிய வாழ்வு உதவியாளர்' },
    { name: 'HELYRA', descEn: 'Intelligent Family Care', descTa: 'அறிவார்ந்த குடும்ப நலப் பாதுகாப்பு' },
    { name: 'AURA', descEn: 'Intelligent Wellness Companion', descTa: 'அறிவார்ந்த நல்வாழ்வு துணை' },
    { name: 'SANJEEVI', descEn: 'Holistic Longevity & Care', descTa: 'முழுமையான ஆரோக்கியப் பாதுகாப்பு' },
    { name: 'AAYUSH', descEn: 'Vital Longevity Companion', descTa: 'ஆயுள் & உடல்நல வழிகாட்டி' }
  ];

  const handleApplyName = (newName: string) => {
    const clean = newName.trim();
    if (clean) {
      setBrandName(clean);
      setShowRenameModal(false);
    }
  };

  return (
    <>
      {/* Mobile TopBar — clean, light theme */}
      <header className="md:hidden sticky top-0 z-30 bg-white text-slate-900 px-4 py-2.5 shadow-xs border-b border-slate-200">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Logo & Brand with interactive quick name editor */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveScreen('home')}
              className="flex items-center space-x-2 text-left active:scale-98 transition group"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center shadow-xs">
                <HeartPulse className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h1 className="font-bold text-sm tracking-tight text-slate-900 group-hover:text-teal-700 transition">
                    {brandName || 'Helyra AI'}
                  </h1>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-none">
                  {APP_TAGLINE}
                </p>
              </div>
            </button>

            {/* Quick Rename Trigger Button */}
            <button
              onClick={() => {
                setInputName(brandName || 'Helyra AI');
                setShowRenameModal(true);
              }}
              title="Change App Name"
              aria-label="Change Brand Name"
              className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition border border-slate-200 active:scale-90"
            >
              <Edit2 className="w-3 h-3 text-slate-600" />
            </button>
          </div>

          {/* Action Controls: Steps Badge, Install, SOS, Language, Security & Logout */}
          <div className="flex items-center space-x-1.5">
            {/* Install App Button */}
            {isInstallable && (
              <button
                onClick={installApp}
                aria-label="Install App"
                className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold active:scale-95 transition-all shadow-xs"
                title="Install Helyra AI as App"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="text-[11px]">Install</span>
              </button>
            )}

            {/* Live Steps Quick Badge */}
            <button
              onClick={() => setActiveScreen('fitness')}
              aria-label="View Step Counter & Fitness"
              className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold active:scale-95 transition-all"
              title="Fitness & Step Tracker"
            >
              <Footprints className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-[11px] font-mono">
                {(todayStats?.steps || 0).toLocaleString()}
              </span>
            </button>

            {/* SOS Emergency Trigger */}
            {onOpenSOS && (
              <button
                onClick={onOpenSOS}
                aria-label="Emergency SOS"
                className="w-7 h-7 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-all active:scale-95"
                title="Emergency SOS Alert"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              </button>
            )}

            {/* Language Toggle (Tamil / English) */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              aria-label="Toggle Tamil and English"
              className="px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all text-[11px] font-semibold border border-slate-200 active:scale-95"
              title="Switch Language (தமிழ் / English)"
            >
              <span>{language === 'en' ? 'தமிழ்' : 'ENG'}</span>
            </button>

            {/* User Profile / Settings with Avatar */}
            <button
              onClick={() => setActiveScreen('settings')}
              aria-label="Settings & Profile"
              className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all border overflow-hidden active:scale-95 ${
                activeScreen === 'settings'
                  ? 'border-teal-500 ring-2 ring-teal-500/20'
                  : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
              }`}
              title="Settings & Profile"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[11px] font-bold text-teal-700">
                  {user.name?.charAt(0) || 'U'}
                </span>
              )}
            </button>

            {/* Sign Out */}
            <button
              onClick={logout}
              aria-label="Sign Out"
              className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-all flex items-center justify-center border border-slate-200 hover:border-rose-200 active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Brand Name Customizer Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-sm w-full shadow-xl text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Change Brand Name
                </h3>
              </div>
              <button
                onClick={() => setShowRenameModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Instantly rename your health companion. Select a curated preset or type your custom name below.
            </p>

            {/* Custom Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700">
                Custom Name
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputName}
                  onChange={e => setInputName(e.target.value)}
                  placeholder="e.g. VITALIS, HELYRA..."
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleApplyName(inputName);
                  }}
                />
                <button
                  onClick={() => handleApplyName(inputName)}
                  className="px-3.5 py-2 bg-teal-600 text-white font-bold rounded-xl text-xs flex items-center space-x-1 hover:bg-teal-700 active:scale-95 transition shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {/* Presets List */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500">
                Popular Presets:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {presetNames.map(p => {
                  const isCurrent = (brandName || 'Helyra AI').toUpperCase() === p.name.toUpperCase();
                  return (
                    <button
                      key={p.name}
                      onClick={() => handleApplyName(p.name)}
                      className={`p-2.5 rounded-xl text-left border transition active:scale-95 ${
                        isCurrent
                          ? 'bg-teal-50 border-teal-500 text-teal-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{p.name}</span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-teal-600" />}
                      </div>
                      <p className="text-[9px] text-slate-500 leading-tight mt-0.5 truncate">
                        {p.descEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// =============================================
// Desktop Top Content Bar (md+ screens)
// Shows screen title + quick actions on the right
// =============================================
const SCREEN_TITLES: Record<string, string> = {
  home: 'Dashboard',
  fitness: 'Fitness & Activity',
  'step-debug': 'Step Debug',
  meds: 'Medicines',
  docs: 'Medical Documents',
  family: 'Family Health',
  reports: 'Health Reports',
  settings: 'Settings',
  profile: 'Settings',
  security: 'Settings',
};

interface DesktopTopBarProps {
  onOpenSOS?: () => void;
}

export const DesktopTopBar: React.FC<DesktopTopBarProps> = ({ onOpenSOS }) => {
  const { activeScreen, user, todayStats, language, setLanguage } = useHealth();
  const { isInstallable, installApp } = usePWAInstallPrompt();
  const title = SCREEN_TITLES[activeScreen] || 'Helyra AI';

  return (
    <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">{title}</h2>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Welcome back, <span className="text-teal-700 font-semibold">{user.name?.split(' ')[0]}</span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* PWA Install Button */}
        {isInstallable && (
          <button
            onClick={installApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
            title="Install Helyra AI as standalone desktop app"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}

        {/* Step badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700">
          <Footprints className="w-3.5 h-3.5 text-teal-600" />
          <span className="text-xs font-mono font-bold">{(todayStats?.steps || 0).toLocaleString()} steps</span>
        </div>

        {/* Language toggle */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all active:scale-95"
          title="Switch Language (தமிழ் / English)"
        >
          {language === 'en' ? 'தமிழ்' : 'ENG'}
        </button>

        {/* SOS */}
        {onOpenSOS && (
          <button
            onClick={onOpenSOS}
            className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-all"
            title="Emergency SOS Alert"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </button>
        )}
      </div>
    </header>
  );
};

export const BottomNav: React.FC = () => {
  const { activeScreen, setActiveScreen, t } = useHealth();

  const navItems = [
    { id: 'home', label: t.navHome || 'Home', icon: HeartPulse },
    { id: 'fitness', label: 'Fitness', icon: Activity },
    { id: 'meds', label: 'Medicines', icon: Pill },
    { id: 'family', label: t.navFamily || 'Family', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    // Mobile-only bottom nav: clean light styling
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 shadow-xs safe-area-pb">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1 items-center">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            activeScreen === item.id ||
            (item.id === 'fitness' && activeScreen === 'step-debug');
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-150 select-none ${
                isActive
                  ? 'text-teal-700 bg-teal-50 font-bold border border-teal-200 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Icon
                className={`w-4 h-4 mb-0.5 transition-transform ${
                  isActive ? 'stroke-[2.5] text-teal-600 scale-105' : 'stroke-[1.8] text-slate-400'
                }`}
              />
              <span className={`text-[10px] truncate max-w-full block leading-tight ${isActive ? 'font-bold text-teal-800' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

// =============================================
// Desktop Sidebar Navigation (md+ screens)
// =============================================

interface SideNavProps {
  onOpenSOS?: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({ onOpenSOS, collapsed, onToggleCollapse }) => {
  const { activeScreen, setActiveScreen, t, user, todayStats, brandName, logout } = useHealth();
  const { isInstallable, installApp } = usePWAInstallPrompt();

  const navItems = [
    { id: 'home',    label: t.navHome || 'Home',    icon: HeartPulse },
    { id: 'fitness', label: 'Fitness',               icon: Activity },
    { id: 'meds',    label: 'Medicines',             icon: Pill },
    { id: 'family',  label: t.navFamily || 'Family', icon: Users },
    { id: 'reports', label: t.navReports || 'Reports', icon: FileText },
  ];

  const bottomItems = [
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`
        hidden md:flex flex-col h-screen sticky top-0
        bg-white text-slate-800
        border-r border-slate-200 shadow-xs
        transition-all duration-300 ease-in-out shrink-0
        ${collapsed ? 'w-[68px]' : 'w-[220px]'}
      `}
    >
      {/* Brand Logo */}
      <div className={`flex items-center gap-3 px-3 py-4 border-b border-slate-100 ${collapsed ? 'justify-center' : ''}`}>
        <div className="shrink-0">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-xs">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-bold text-sm text-slate-900 leading-tight truncate">{brandName || 'Helyra AI'}</p>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5 truncate">Health Companion</p>
          </div>
        )}
      </div>

      {/* User Info Card */}
      {!collapsed && (
        <div className="mx-2 mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
              ) : (
                user.name?.charAt(0) || 'H'
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 truncate">{user.name?.split(' ')[0]}</p>
              <div className="flex items-center gap-1">
                <Footprints className="w-2.5 h-2.5 text-teal-600" />
                <span className="text-[10px] text-slate-500 font-mono font-medium">
                  {(todayStats?.steps || 0).toLocaleString()} steps
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed avatar */}
      {collapsed && (
        <div className="flex justify-center mt-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-xs overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
            ) : (
              user.name?.charAt(0) || 'H'
            )}
          </div>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 px-2 pt-3 space-y-1 overflow-y-auto helyra-scrollbar">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id || (item.id === 'fitness' && activeScreen === 'step-debug');
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-150 group
                ${isActive
                  ? 'bg-teal-50 border border-teal-200 text-teal-800 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent font-medium'}
                ${collapsed ? 'justify-center px-2' : ''}
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
              {!collapsed && (
                <span className="text-xs truncate">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="px-2 pb-2 space-y-1.5">
          {isInstallable && (
            <button
              onClick={installApp}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-all font-semibold text-xs shadow-xs"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Install App</span>
            </button>
          )}
          {onOpenSOS && (
            <button
              onClick={onOpenSOS}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-all font-medium text-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Emergency SOS</span>
            </button>
          )}
        </div>
      )}

      {/* Collapsed quick actions */}
      {collapsed && (
        <div className="px-2 pb-2 flex flex-col items-center gap-1.5">
          {isInstallable && (
            <button
              onClick={installApp}
              title="Install App"
              className="w-9 h-9 rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center transition-all shadow-xs"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {onOpenSOS && (
            <button
              onClick={onOpenSOS}
              title="Emergency SOS"
              className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Bottom nav items + logout */}
      <div className={`border-t border-slate-100 px-2 py-2 space-y-0.5 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        {bottomItems.map(item => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              title={collapsed ? item.label : undefined}
              className={`
                w-full flex items-center gap-2.5 rounded-xl px-3 py-1.5 transition-all
                ${isActive ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}
                ${collapsed ? 'justify-center px-2 w-9 h-9' : ''}
              `}
            >
              <Icon className="w-4 h-4 shrink-0 text-slate-400" />
              {!collapsed && <span className="text-xs">{item.label}</span>}
            </button>
          );
        })}
        <button
          onClick={logout}
          title={collapsed ? 'Sign Out' : undefined}
          className={`
            w-full flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all
            ${collapsed ? 'justify-center px-2 w-9 h-9' : ''}
          `}
        >
          <LogOut className="w-4 h-4 shrink-0 text-slate-400" />
          {!collapsed && <span className="text-xs">Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={onToggleCollapse}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center transition-all shadow-xs z-10"
      >
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5" />
          : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
};
