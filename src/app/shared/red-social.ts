import { RedSocial } from '../models/cortometraje.model';

export const REDES_SOCIALES: { valor: RedSocial; etiqueta: string }[] = [
  { valor: 'facebook', etiqueta: 'Facebook' },
  { valor: 'instagram', etiqueta: 'Instagram' },
  { valor: 'tiktok', etiqueta: 'TikTok' },
  { valor: 'youtube', etiqueta: 'YouTube' },
  { valor: 'x', etiqueta: 'X' },
];

export function etiquetaRedSocial(valor: RedSocial): string {
  return REDES_SOCIALES.find((r) => r.valor === valor)?.etiqueta ?? valor;
}

export function colorRedSocial(valor: RedSocial | ''): string {
  switch (valor) {
    case 'facebook':
      return '#1877f2';
    case 'instagram':
      return 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af, #515bd4)';
    case 'tiktok':
      return '#010101';
    case 'youtube':
      return '#ff0000';
    case 'x':
      return '#1a1a1a';
    default:
      return '#9ca3af';
  }
}
