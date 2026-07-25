import { createContext, useContext, useReducer } from 'react';
import type { ReactNode, Dispatch } from 'react';
import type { Category, Source, Investigation, ViewType } from '../types';

export interface AppState {
  currentView: ViewType;
  anthropicKey: string;
  shodanKey: string;
  categories: Category[];
  selectedCategory: Category | null;
  allSources: Source[];
  search: string;
  isLoadingSources: boolean;
  investigations: Investigation[];
  isLoadingInvestigations: boolean;
  isChatOpen: boolean;
}

export type AppAction =
  | { type: 'SET_VIEW'; view: ViewType }
  | { type: 'SET_KEYS'; anthropicKey: string; shodanKey: string }
  | { type: 'SET_CATEGORIES'; categories: Category[] }
  | { type: 'SELECT_CATEGORY'; category: Category | null }
  | { type: 'SET_SOURCES'; sources: Source[] }
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SET_LOADING_SOURCES'; loading: boolean }
  | { type: 'SET_INVESTIGATIONS'; investigations: Investigation[] }
  | { type: 'SET_LOADING_INVESTIGATIONS'; loading: boolean }
  | { type: 'SET_CHAT_OPEN'; open: boolean };

const initialState: AppState = {
  currentView: 'dashboard',
  anthropicKey: '',
  shodanKey: '',
  categories: [],
  selectedCategory: null,
  allSources: [],
  search: '',
  isLoadingSources: false,
  investigations: [],
  isLoadingInvestigations: false,
  isChatOpen: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.view };
    case 'SET_KEYS':
      return { ...state, anthropicKey: action.anthropicKey, shodanKey: action.shodanKey };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.categories };
    case 'SELECT_CATEGORY':
      return { ...state, selectedCategory: action.category };
    case 'SET_SOURCES':
      return { ...state, allSources: action.sources };
    case 'SET_SEARCH':
      return { ...state, search: action.search };
    case 'SET_LOADING_SOURCES':
      return { ...state, isLoadingSources: action.loading };
    case 'SET_INVESTIGATIONS':
      return { ...state, investigations: action.investigations };
    case 'SET_LOADING_INVESTIGATIONS':
      return { ...state, isLoadingInvestigations: action.loading };
    case 'SET_CHAT_OPEN':
      return { ...state, isChatOpen: action.open };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
