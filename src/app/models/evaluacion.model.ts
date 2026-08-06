export interface Evaluacion {
  id: string;
  cortometrajeId: string;
  juezId: string;
  jurado: string;
  puntuaciones: Record<string, number>;
  comentario: string;
  creadoEn: number;
}
