import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { Language } from './i18n';
import { useI18n } from './i18n';
import { api } from './api';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AppShell from './components/AppShell';
import Upload from './screens/Upload';
import Verify from './screens/Verify';
import Summary from './screens/Summary';
import Timeline from './screens/Timeline';
import Medicines from './screens/Medicines';
import Trends from './screens/Trends';
import Alerts from './screens/Alerts';
import Abha from './screens/Abha';
import Settings from './screens/Settings';
import Emergency from './screens/Emergency';
import Ask from './screens/Ask';

export type AppContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: ReturnType<typeof useI18n>['t'];
  profileId: string;
  useMock: boolean;
  setUseMock: (value: boolean) => void;
};

export const AppContext = createContext<AppContextType>({
  lang: 'en',
  setLang: () => {},
  t: (key: string) => key,
  profileId: 'default',
  useMock: true,
  setUseMock: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => {
    try {
      return (localStorage.getItem('health-copilot-lang') as Language) || 'en';
    } catch {
      return 'en';
    }
  });
  const [useMock, setUseMock] = useState(() => api.getUseMock());
  const [isReady, setIsReady] = useState(false);

  const i18n = useI18n(lang);
  const t = i18n.t;

  useEffect(() => {
    try {
      localStorage.setItem('health-copilot-lang', lang);
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    api.setUseMock(useMock);
  }, [useMock]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.healthCheck();
      } catch {
        // ignore
      }
      setIsReady(true);
    };
    checkHealth();
  }, []);

  const contextValue: AppContextType = {
    lang,
    setLang,
    t,
    profileId: 'default',
    useMock,
    setUseMock,
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <BrowserRouter>
        <div className="min-h-screen bg-surface-50">
          <Header />
          <main className="pb-20 md:pb-0 md:pl-64">
            <Routes>
              <Route path="/" element={<AppShell />}>
                <Route index element={<Navigate to="/timeline" replace />} />
                <Route path="upload" element={<Upload />} />
                <Route path="verify/:id" element={<Verify />} />
                <Route path="summary/:id" element={<Summary />} />
                <Route path="timeline" element={<Timeline />} />
                <Route path="medicines" element={<Medicines />} />
                <Route path="trends" element={<Trends />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="abha" element={<Abha />} />
                <Route path="emergency" element={<Emergency />} />
                <Route path="ask" element={<Ask />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </main>
          <BottomNav />
        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}