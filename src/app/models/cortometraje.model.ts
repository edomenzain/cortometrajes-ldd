export type RedSocial = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'x';

export interface CampanaMarketing {
  redSocial: RedSocial;
  liga: string;
}

export interface Cortometraje {
  id: string;
  periodoId: string;
  titulo: string;
  descripcion: string;
  director: string;
  youtubeUrl?: string;
  campanasMarketing?: CampanaMarketing[];
  creadoEn: number;
}
