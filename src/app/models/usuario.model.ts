export type Rol = 'admin' | 'juez';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  hash: string;
  creadoEn: number;
}
