export interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  role: 'gadik' | 'admin' | 'peserta';
  spesialisasi: Spesialisasi | null;
}

export type Spesialisasi = 'sabhara' | 'reserse' | 'intel' | 'lantas' | 'binmas';

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}
