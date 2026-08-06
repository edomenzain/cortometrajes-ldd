export interface Criterio {
  id: string;
  texto: string;
}

export interface Seccion {
  id: string;
  nombre: string;
  criterios: Criterio[];
}
