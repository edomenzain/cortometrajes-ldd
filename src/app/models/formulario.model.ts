export interface Criterio {
  id: string;
  texto: string;
}

export interface Seccion {
  id: string;
  periodoId: string;
  nombre: string;
  criterios: Criterio[];
  premiacionIds: string[];
}
