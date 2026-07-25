import { useEffect, useCallback } from 'react';
import './index.css';
import { API_BASE_URL } from './types';
import { Sidebar } from './components/Sidebar';
import { CatalogView } from './components/CatalogView';
import { InvestigationsView } from './components/InvestigationsView';
import { SettingsView } from './components/SettingsView';
import { ChatPanel } from './components/ChatPanel';
import { ToastContainer } from './components/Toast';
import { AppProvider, useApp } from './context/AppContext';

function App() {
  const { state, dispatch } = useApp();
  const {
    currentView,
    anthropicKey,
    shodanKey,
    categories,
    selectedCategory,
    allSources,
    search,
    isLoadingSources,
    investigations,
    isLoadingInvestigations,
  } = state;

  // Fetch categories on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/categories/?limit=100`)
      .then(res => res.json())
      .then((data: import('./types').Category[]) => {
        dispatch({ type: 'SET_CATEGORIES', categories: data });
        if (data.length > 0) {
          dispatch({ type: 'SELECT_CATEGORY', category: data[0] });
        }
      })
      .catch(err => console.error("Error fetching categories:", err));
  }, []);

  // Fetch ALL sources on mount for global search
  useEffect(() => {
    dispatch({ type: 'SET_LOADING_SOURCES', loading: true });
    fetch(`${API_BASE_URL}/sources/?limit=1000`)
      .then(res => res.json())
      .then(data => {
        dispatch({ type: 'SET_SOURCES', sources: data });
        dispatch({ type: 'SET_LOADING_SOURCES', loading: false });
      })
      .catch(err => {
        console.error("Error fetching sources:", err);
        dispatch({ type: 'SET_LOADING_SOURCES', loading: false });
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
      dispatch({
        type: 'SET_KEYS',
        anthropicKey: anthropicSetting ? anthropicSetting.value : anthropicKey,
        shodanKey: shodanSetting ? shodanSetting.value : shodanKey,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvestigations = useCallback(async () => {
    try {
      // Only show loading spinner on first load, not on auto-refresh
      // (kept as a no-op dispatch to preserve original behavior/comment intent)
      const res = await fetch(`${API_BASE_URL}/investigations/`);
      const data = await res.json();
      dispatch({ type: 'SET_INVESTIGATIONS', investigations: data });
    } catch (err) {
      console.error(err);
    }
  }, []);

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => dispatch({ type: 'SET_VIEW', view })}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(category) => dispatch({ type: 'SELECT_CATEGORY', category })}
        onClearSearch={() => dispatch({ type: 'SET_SEARCH', search: '' })}
      />

      <div className="main-content">
        {currentView === 'settings' && (
          <SettingsView
            anthropicKey={anthropicKey}
            shodanKey={shodanKey}
            onAnthropicKeyChange={(key) => dispatch({ type: 'SET_KEYS', anthropicKey: key, shodanKey })}
            onShodanKeyChange={(key) => dispatch({ type: 'SET_KEYS', anthropicKey, shodanKey: key })}
          />
        )}

        {currentView === 'catalog' && (
          <CatalogView
            selectedCategory={selectedCategory}
            sources={allSources}
            search={search}
            onSearchChange={(value) => dispatch({ type: 'SET_SEARCH', search: value })}
            onOpenChat={() => dispatch({ type: 'SET_CHAT_OPEN', open: true })}
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

      <ChatPanel />
      <ToastContainer />
    </div>
  );
}

function AppRoot() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  );
}

export default AppRoot;
