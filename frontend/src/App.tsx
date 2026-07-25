import { useState, useEffect, useCallback } from 'react';
import './index.css';
import { API_BASE_URL } from './types';
import type { Category, Source, Investigation, ViewType } from './types';
import { Sidebar } from './components/Sidebar';
import { CatalogView } from './components/CatalogView';
import { InvestigationsView } from './components/InvestigationsView';
import { SettingsView } from './components/SettingsView';
import { ChatModal } from './components/ChatModal';
import { ToastContainer } from './components/Toast';

function App() {
  // View State
  const [currentView, setCurrentView] = useState<ViewType>('catalog');

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
  const [isLoadingInvestigations, setIsLoadingInvestigations] = useState(false);

  // Chat Modal State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/?limit=100`)
      .then(res => res.json())
      .then((data: Category[]) => {
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory(data[0]);
        }
      })
      .catch(err => console.error("Error fetching categories:", err));
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
        console.error("Error fetching sources:", err);
        setIsLoadingSources(false);
      });
  }, []);

  // Fetch settings/investigations when view changes
  useEffect(() => {
    if (currentView === 'investigations') {
      fetchInvestigations();
    } else if (currentView === 'settings') {
      fetchSettings();
    }
  }, [currentView]);

  // Auto-refresh investigations while any are running/pending
  useEffect(() => {
    if (currentView !== 'investigations') return;

    const hasActive = investigations.some(inv =>
      inv.status === 'running' || inv.status === 'pending'
    );
    if (!hasActive) return;

    const interval = setInterval(() => {
      fetchInvestigations();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentView, investigations]);

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
      setIsLoadingInvestigations(prev => {
        // Only show loading spinner on first load, not on auto-refresh
        return prev;
      });
      const res = await fetch(`${API_BASE_URL}/investigations/`);
      const data = await res.json();
      setInvestigations(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onClearSearch={() => setSearch('')}
      />

      <div className="main-content">
        {currentView === 'settings' && (
          <SettingsView
            anthropicKey={anthropicKey}
            shodanKey={shodanKey}
            onAnthropicKeyChange={setAnthropicKey}
            onShodanKeyChange={setShodanKey}
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
          />
        )}

        {currentView === 'investigations' && (
          <InvestigationsView
            investigations={investigations}
            onRefresh={fetchInvestigations}
            isLoading={isLoadingInvestigations}
          />
        )}
      </div>

      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <ToastContainer />
    </div>
  );
}

export default App;
