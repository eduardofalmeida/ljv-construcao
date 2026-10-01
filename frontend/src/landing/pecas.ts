export type MatNome = 'concreto' | 'concretoEscuro' | 'aco' | 'vidro' | 'madeira' | 'pedra' | 'luz'

export interface Peca {
  id: string
  s: [number, number, number]
  p: [number, number, number]
  r?: [number, number, number]
  mat: MatNome
  fase: number
}

/** Massa conceitual: pavilhão baixo + núcleo vertical. Não é uma obra da LJV. */
export const PECAS: Peca[] = [
  { id: 'radier', s: [9.2, 0.07, 6.2], p: [0.4, 0.035, 0.05], mat: 'pedra', fase: 0.05 },
  { id: 'laje0', s: [7.6, 0.2, 4.9], p: [0.45, 0.17, 0.06], mat: 'concretoEscuro', fase: 0.12 },
  { id: 'degrau', s: [1.7, 0.07, 0.8], p: [-0.45, 0.1, 2.78], mat: 'pedra', fase: 0.16 },

  { id: 'p1', s: [0.24, 2.52, 0.24], p: [-3.05, 1.56, -2.1], mat: 'concreto', fase: 0.26 },
  { id: 'p2', s: [0.24, 2.52, 0.24], p: [0.5, 1.56, -2.1], mat: 'concreto', fase: 0.28 },
  { id: 'p3', s: [0.24, 2.52, 0.24], p: [4.0, 1.56, -2.1], mat: 'concreto', fase: 0.3 },
  { id: 'p4', s: [0.24, 2.52, 0.24], p: [-3.05, 1.56, 2.2], mat: 'concreto', fase: 0.28 },
  { id: 'p5', s: [0.24, 2.52, 0.24], p: [0.5, 1.56, 2.2], mat: 'concreto', fase: 0.3 },
  { id: 'p6', s: [0.24, 2.52, 0.24], p: [4.0, 1.56, 2.2], mat: 'concreto', fase: 0.32 },

  { id: 'v1', s: [7.3, 0.16, 0.22], p: [0.48, 2.9, -2.1], mat: 'concreto', fase: 0.38 },
  { id: 'v2', s: [7.3, 0.16, 0.22], p: [0.48, 2.9, 2.2], mat: 'concreto', fase: 0.38 },
  { id: 'v3', s: [0.22, 0.16, 4.52], p: [-3.05, 2.9, 0.05], mat: 'concreto', fase: 0.4 },
  { id: 'v4', s: [0.22, 0.16, 4.52], p: [4.0, 2.9, 0.05], mat: 'concreto', fase: 0.4 },
  { id: 'v5', s: [0.16, 0.12, 4.2], p: [0.5, 2.82, 0.05], mat: 'aco', fase: 0.42 },

  { id: 'tn', s: [1.9, 3.35, 0.1], p: [-2.35, 1.98, -1.05], mat: 'concretoEscuro', fase: 0.44 },
  { id: 'to', s: [0.1, 3.35, 1.8], p: [-3.3, 1.98, -0.12], mat: 'concretoEscuro', fase: 0.44 },
  { id: 'tl', s: [0.1, 3.35, 1.8], p: [-1.4, 1.98, -0.12], mat: 'concreto', fase: 0.46 },
  { id: 'ts1', s: [0.58, 3.35, 0.1], p: [-2.9, 1.98, 0.78], mat: 'concretoEscuro', fase: 0.46 },
  { id: 'ts2', s: [0.58, 3.35, 0.1], p: [-1.8, 1.98, 0.78], mat: 'concretoEscuro', fase: 0.46 },
  { id: 'tcapa', s: [2.12, 0.07, 2.05], p: [-2.35, 3.7, -0.12], mat: 'concreto', fase: 0.84 },

  { id: 'laje1', s: [5.15, 0.1, 4.05], p: [1.55, 2.74, 0.06], mat: 'concreto', fase: 0.5 },

  { id: 'fundo', s: [5.15, 2.22, 0.08], p: [1.5, 1.46, -1.98], mat: 'concreto', fase: 0.58 },
  { id: 'frente', s: [4.3, 0.66, 0.08], p: [1.7, 0.68, 2.14], mat: 'concreto', fase: 0.6 },
  { id: 'lateral', s: [0.08, 2.22, 2.15], p: [3.92, 1.46, -0.85], mat: 'concreto', fase: 0.62 },

  { id: 'cortina', s: [4.15, 1.42, 0.035], p: [1.65, 1.74, 2.12], mat: 'vidro', fase: 0.7 },
  { id: 'fresta', s: [0.4, 1.65, 0.035], p: [-2.35, 2.1, 0.86], mat: 'vidro', fase: 0.72 },
  { id: 'm1', s: [0.022, 1.42, 0.045], p: [0.35, 1.74, 2.16], mat: 'aco', fase: 0.73 },
  { id: 'm2', s: [0.022, 1.42, 0.045], p: [1.4, 1.74, 2.16], mat: 'aco', fase: 0.73 },
  { id: 'm3', s: [0.022, 1.42, 0.045], p: [2.45, 1.74, 2.16], mat: 'aco', fase: 0.74 },
  { id: 'm4', s: [0.022, 1.42, 0.045], p: [3.4, 1.74, 2.16], mat: 'aco', fase: 0.74 },

  { id: 'tubo1', s: [3.1, 0.03, 0.03], p: [1.7, 2.58, 0.35], mat: 'aco', fase: 0.68 },
  { id: 'tubo2', s: [0.03, 0.03, 2.2], p: [2.55, 2.58, 0.2], mat: 'aco', fase: 0.69 },

  { id: 'piso', s: [3.2, 0.035, 2.15], p: [1.45, 0.34, 0.2], mat: 'madeira', fase: 0.78 },
  { id: 'porta', s: [0.82, 1.95, 0.045], p: [-0.55, 1.26, 2.18], mat: 'madeira', fase: 0.8 },

  { id: 'cobertura', s: [5.55, 0.06, 5.45], p: [1.72, 3.16, 0.08], r: [-0.04, 0, 0], mat: 'concreto', fase: 0.86 },
  { id: 'rufo', s: [5.6, 0.028, 0.05], p: [1.72, 3.06, 2.78], mat: 'aco', fase: 0.9 },
  { id: 'luz', s: [3.2, 0.012, 0.012], p: [1.6, 3.0, 2.42], mat: 'luz', fase: 0.92 },
]
