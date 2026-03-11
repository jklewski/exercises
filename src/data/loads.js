/**
 * Load data tables (SS-EN 1990 + SS-EN 1991-1-1 with Swedish NA / EKS 11).
 */

// ── ψ-factors for variable loads (SS-EN 1990, Tabell NA.A1.1) ─────────────
// Used in STR-B combination: Ed = γ_G·Gk + γ_Q·Qk,1 + γ_Q·Σ(ψ₀,i·Qk,i)
//   ψ₀ = combination factor (accompanying action in ULS)
//   ψ₁ = frequent factor (leading action in SLS frequent)
//   ψ₂ = quasi-permanent factor (SLS quasi-permanent / secondary in ULS)
export const PSI_FACTORS = [
  { load: 'NL_A',          psi0: 0.7, psi1: 0.5, psi2: 0.3 },
  { load: 'NL_B',          psi0: 0.7, psi1: 0.5, psi2: 0.3 },
  { load: 'NL_C',          psi0: 0.7, psi1: 0.7, psi2: 0.6 },
  { load: 'NL_D',          psi0: 0.7, psi1: 0.7, psi2: 0.6 },
  { load: 'NL_E',          psi0: 1.0, psi1: 0.9, psi2: 0.8 },
  { load: 'NL_F',          psi0: 0.7, psi1: 0.7, psi2: 0.6 },
  { load: 'NL_G',          psi0: 0.7, psi1: 0.5, psi2: 0.3 },
  { load: 'Snö',           psi0: 0.7, psi1: 0.5, psi2: 0.2 },
  { load: 'Vind',          psi0: 0.3, psi1: 0.2, psi2: 0.0 },
  { load: 'Temp',          psi0: 0.6, psi1: 0.5, psi2: 0.0 },
]

// ── Imposed loads – categories (SS-EN 1991-1-1, Tabell 6.1–6.2) ──────────
// qk = distributed load [kN/m²], Qk = concentrated load [kN]
export const LIVE_LOADS = [
  { category: 'A',  description: 'Bostäder, sovrum, trapphus',                    qk: 2.0, Qk: '2.0–3.0' },
  { category: 'B',  description: 'Kontor',                                         qk: 2.5, Qk: 3 },
  { category: 'C1', description: 'Lokaler med bord (skolor, restauranger)',        qk: 2.5, Qk: 3 },
  { category: 'C2', description: 'Lokaler med fast sittplats (kyrkor, teatrar)',   qk: 3, Qk: '2.5–7.0' },
  { category: 'C3', description: 'Lokaler utan möblerhinder (museer, gallerier)',  qk: 3, Qk: '4.0–7.0' },
  { category: 'C4', description: 'Sport- och danslokaler',                         qk: 4.5, Qk: '3.5–7.0' },
  { category: 'C5', description: 'Folkträngsel (konserthallar, idrottsarenor)',    qk: 5, Qk: '3.5–4.5' },
  { category: 'D1', description: 'Allmänna butiker',                               qk: 4, Qk: '3.5–7.0' },
  { category: 'D2', description: 'Varuhus',                                        qk: 4, Qk: '3.5–7.0' },
  { category: 'E',  description: 'Lager och industribyggnader',                    qk: 7.5,      Qk: '7.0'     },
  { category: 'F',  description: 'Fordonstrafik, fordon ≤ 30 kN',                 qk: 2.5,      Qk: '10'      },
  { category: 'G',  description: 'Fordonstrafik, fordon 30–160 kN',               qk: 5.0,      Qk: '45'      },
]
