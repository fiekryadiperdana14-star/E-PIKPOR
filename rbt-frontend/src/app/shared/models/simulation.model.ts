import { Spesialisasi } from './user.model';
export type { Spesialisasi } from './user.model';

export interface SimulationInput {
  judul: string;
  narasiKasus: string;
  spesialisasi: Spesialisasi;
  language?: 'id' | 'en'; // Language preference for AI-generated content
}

export interface LegalReference {
  id?: number;
  pasal_number: string;
  undang_undang: string;
  deskripsi: string;
  ancaman_pidana: string;
  // Alias from API response
  pasal?: string;
  undangUndang?: string;
  ancamanPidana?: string;
}

export interface RBTStep {
  fase: string;
  durasi: string;
  aktivitas: string[];
}

export interface EvaluationCriteria {
  kriteria: string;
  bobot: number;
  deskripsi: string;
}

export interface RBTScenario {
  skenario_rbt: {
    judul: string;
    ringkasan: string;
  };
  tujuan_pelatihan: string;
  peralatan: string;
  langkah_langkah: RBTStep[];
  evaluasi_kriteria: EvaluationCriteria[];
  durasi_estimasi: string;
  tingkat_kesulitan: 'dasar' | 'menengah' | 'lanjutan';
}

export interface SimulationResult {
  simulationId: number;
  judul: string;
  spesialisasi: Spesialisasi;
  keywords: string[];
  categories: string[];
  legalReferences: LegalReference[];
  rbtScenario: RBTScenario;
  status: string;
}

export interface Simulation {
  id: number;
  user_id: number;
  judul: string;
  narasi_kasus: string;
  kata_kunci: string[];
  spesialisasi: Spesialisasi;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  skenario_rbt?: any;
  tujuan_pelatihan?: string;
  durasi_estimasi?: string;
  tingkat_kesulitan?: string;
  legalReferences?: LegalReference[];
  result?: any;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}
