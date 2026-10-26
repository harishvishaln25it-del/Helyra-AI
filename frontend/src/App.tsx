/**
 * HELYRA — AI-Powered Adaptive Family Health Companion
 * "Not Just AI That Responds — AI That Adapts."
 */
import React, { useState } from 'react';
import { HealthProvider, useHealth } from './context/HealthContext';
import { TopBar, BottomNav, SideNav, DesktopTopBar } from './components/Navigation';
import { SOSModal } from './components/SOSModal';
import { SOSEmergencyVoiceListener } from './components/SOSEmergencyVoiceListener';
import { HomeScreen } from './screens/HomeScreen';
import { MedicationScreen } from './screens/MedicationScreen';
import { DocumentsScreen } from './screens/DocumentsScreen';
import { FamilyScreen } from './screens/FamilyScreen';
import { ReportsScreen } from './screens/ReportsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { FitnessTrackerScreen } from './screens/FitnessTrackerScreen';
import { StepTrackingDebugScreen } from './screens/StepTrackingDebugScreen';
import { stepCounterService } from './services/stepCounterService';
import { HeartPulse } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeScreen, user, isAuthenticated, authLoading, setActiveScreen, brandName } = useHealth();
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [sosAutoDial, setSosAutoDial] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Automatically start native background step tracking when authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      stepCounterService.startTracking().catch(() => {});
    }
  }, [isAuthenticated]);

  const isLargeText = user.adaptivePreferences?.fontSize === 'large';

  // Session verification loading splash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 text-slate-900">
        <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center shadow-xs">
          <HeartPulse className="w-7 h-7 text-teal-600 animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-base font-bold tracking-tight text-slate-900">{brandName || 'Helyra AI'}</p>
          <p className="text-xs text-slate-500">Loading your health data...</p>
        </div>
      </div>
    );
  }

  // If user is not logged in, show the modern LoginScreen
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setActiveScreen('home')} />;
  }

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'home':
        return (
          <HomeScreen
            onOpenSOS={() => setIsSOSOpen(true)}
          />
        );
      case 'fitness':
        return (
          <FitnessTrackerScreen
            onOpenDebug={() => setActiveScreen('step-debug')}
          />
        );
      case 'step-debug':
        return (
          <StepTrackingDebugScreen
            onBack={() => setActiveScreen('fitness')}
          />
        );
      case 'food':
        return (
          <HomeScreen
            onOpenSOS={() => setIsSOSOpen(true)}
          />
        );
      case 'meds':
        return <MedicationScreen />;
      case 'docs':
        return <DocumentsScreen />;
      case 'family':
        return <FamilyScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
      case 'security':
      case 'profile':
        return <SettingsScreen />;
      default:
        return (
          <HomeScreen
            onOpenSOS={() => setIsSOSOpen(true)}
          />
        );
    }
  };

  return (
    <div
      className={`min-h-screen bg-slate-50 text-slate-900 flex font-sans ${
        isLargeText ? 'text-lg' : 'text-base'
      }`}
    >
      {/* ── EMERGENCY VOICE LISTENER (Hands-Free Voice SOS Only) ── */}
      <SOSEmergencyVoiceListener
        onTriggerSOS={(autoDial = false) => {
          setSosAutoDial(autoDial);
          setIsSOSOpen(true);
        }}
        isSOSOpen={isSOSOpen}
      />

      {/* ── DESKTOP: Persistent Sidebar Navigation ── */}
      <SideNav
        onOpenSOS={() => {
          setSosAutoDial(false);
          setIsSOSOpen(true);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
      />

      {/* ── MAIN CONTENT COLUMN ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0 bg-slate-50">

        {/* Mobile Top Bar (hidden on md+) */}
        <TopBar
          onOpenSOS={() => {
            setSosAutoDial(false);
            setIsSOSOpen(true);
          }}
        />

        {/* Desktop Top Bar (hidden on mobile) */}
        <DesktopTopBar
          onOpenSOS={() => {
            setSosAutoDial(false);
            setIsSOSOpen(true);
          }}
        />

        {/* ── SCROLLABLE SCREEN CONTENT ── */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile: neat centered container, Desktop: max-w-6xl centered workspace */}
          <div className="w-full max-w-md mx-auto md:max-w-6xl px-4 py-4 md:px-8 md:py-6 pb-24 md:pb-8">
            {renderActiveScreen()}
          </div>
        </main>

        {/* ── MOBILE ONLY: Bottom Navigation Bar ── */}
        <BottomNav />
      </div>

      {/* ── GLOBAL: Emergency SOS Modal ── */}
      <SOSModal
        isOpen={isSOSOpen}
        autoDialImmediately={sosAutoDial}
        onClose={() => {
          setIsSOSOpen(false);
          setSosAutoDial(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <HealthProvider>
      <MainLayout />
    </HealthProvider>
  );
}
