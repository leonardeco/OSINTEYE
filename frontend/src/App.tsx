import { useState, useEffect, useCallback } from 'react';
import './index.css';
import { API_BASE_URL } from './types';
import type { Category, Source, Investigation, ViewType } from './types';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { CatalogView } from './components/CatalogView';
import { InvestigationsView } from './components/InvestigationsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ChatDrawer } from './components/ChatDrawer';
import { ToastContainer } from './components/Toast';

function AppInner() {
  const { setInvestigationsCount, setActiveCount } = useApp();

  // View State
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  // Config State
  const [anthropicKey, setAnthropicKey] = useState('');
  const [shodanKey, setShodanKey] = useState('');

  // Catalog State
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [allSources, setAllSources] = useState<Source[]>([]);
  const [search, setSearch] = useState('');
  const [isLoadingSources, setIsLoadingSources] = useState(false);

  // Investigations State
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [isLoadingInvestigations] = useState(false);

  // Chat Drawer State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/?limit=100`)
      .then(res => res.json())
      .then((data: Category[]) => {
        setCategories(data);
        if (data.length > 0) setSelectedCategory(data[0]);
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  // Fetch ALL sources on mount for global search
  useEffect(() => {
    setIsLoadingSources(true);
    fetch(`${API_BASE_URL}/sources/?limit=1000`)
      .then(res => res.json())
      .then(data => {
        setAllSources(data);
        setIsLoadingSources(false);
      })
      .catch(err => {
        console.error('Error fetching sources:', err);
        setIsLoadingSources(false);
      });
  }, []);

  // Fetch investigations on mount
  useEffect(() => {
    fetchInvestigations();
  }, []);

  // Fetch settings/investigations when view changes
  useEffect(() => {
    if (currentView === 'settings') fetchSettings();
  }, [currentView]);

  // Auto-refresh investigations while any are running/pending
  useEffect(() => {
    const hasActive = investigations.some(inv =>
      inv.status === 'running' || inv.status === 'pending'
    );
    if (!hasActive) return;

    const interval = setInterval(() => {
      fetchInvestigations();
    }, 5000);

    return () => clearInterval(interval);
  }, [investigations]);

  // Sync global counts
  useEffect(() => {
    setInvestigationsCount(investigations.length);
    setActiveCount(investigations.filter(i => i.status === 'running' || i.status === 'pending').length);
  }, [investigations, setInvestigationsCount, setActiveCount]);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings/`);
      const data = await res.json();
      const anthropicSetting = data.find((s: any) => s.key === 'anthropic_api_key');
      const shodanSetting = data.find((s: any) => s.key === 'shodan_api_key');
      if (anthropicSetting) setAnthropicKey(anthropicSetting.value);
      if (shodanSetting) setShodanKey(shodanSetting.value);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvestigations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/investigations/`);
      const data = await res.json();
      setInvestigations(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const activeCount = investigations.filter(i => i.status === 'running' || i.status === 'pending').length;

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onClearSearch={() => setSearch('')}
        activeCount={activeCount}
        onOpenChat={() => setIsChatOpen(true)}
      />

      <div className="main-content">
        {currentView === 'dashboard' && (
          <DashboardView
            onNavigate={setCurrentView}
            totalSources={allSources.length}
            totalCategories={categories.length}
            investigations={investigations}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogView
            selectedCategory={selectedCategory}
            sources={allSources}
            search={search}
            onSearchChange={setSearch}
            onOpenChat={() => setIsChatOpen(true)}
            isLoading={isLoadingSources}
            categories={categories}
          />
        )}

        {currentView === 'investigations' && (
          <InvestigationsView
            investigations={investigations}
            onRefresh={fetchInvestigations}
            isLoading={isLoadingInvestigations}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView
            investigations={investigations}
            onRefresh={fetchInvestigations}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            anthropicKey={anthropicKey}
            shodanKey={shodanKey}
            onAnthropicKeyChange={setAnthropicKey}
            onShodanKeyChange={setShodanKey}
          />
        )}
      </div>

      <ChatDrawer isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
