export const API_BASE_URL = 'http://127.0.0.1:8000';

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
}

export interface Source {
  id: string;
  category_id: string;
  name: string;
  url: string;
  description: string;
  access_type: string;
  status: string;
}

export interface Investigation {
  id: string;
  name: string;
  target: string;
  status: string;
  created_at: string;
  results: ScanResult[];
  investigation_type?: string;
}

export interface ScanResult {
  id: string;
  module_name: string;
  status: string;
  raw_data: any;
  created_at: string;
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
}

export type ViewType = 'catalog' | 'investigations' | 'settings' | 'dashboard' | 'reports';

export const INVESTIGATION_TYPES = [
  { key: 'domain' as const, label: '🌐 Dominio', placeholder: 'ej. google.com', icon: '🌐' },
  { key: 'phone' as const, label: '📱 Celular', placeholder: 'ej. +573226993891', icon: '📱' },
  { key: 'email' as const, label: '📧 Email', placeholder: 'ej. user@gmail.com', icon: '📧' },
  { key: 'ip' as const, label: '🖥️ IP', placeholder: 'ej. 8.8.8.8', icon: '🖥️' },
] as const;

export type InvestigationType = typeof INVESTIGATION_TYPES[number]['key'];
