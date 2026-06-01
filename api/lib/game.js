export const SECTIONS = [
  { name: "ROJO",   multiplier: 1.5 },
  { name: "AZUL",   multiplier: 2   },
  { name: "ROJO",   multiplier: 1.5 },
  { name: "BLANCO", multiplier: 3   },
  { name: "ROJO",   multiplier: 1.5 },
  { name: "AZUL",   multiplier: 2   },
  { name: "ROJO",   multiplier: 1.5 },
  { name: "NEGRO",  multiplier: 0   },
  { name: "ROJO",   multiplier: 1.5 },
  { name: "AZUL",   multiplier: 2   },
  { name: "ROJO",   multiplier: 1.5 },
  { name: "BLANCO", multiplier: 3   },
  { name: "ROJO",   multiplier: 1.5 },
  { name: "AZUL",   multiplier: 2   },
];

// Fichas por dólar según cada paquete de compra
export const PACKAGES = {
  starter: { fichas: 500,   usd: 0    },
  basic:   { fichas: 1500,  usd: 5    },
  plus:    { fichas: 4000,  usd: 10   },
  pro:     { fichas: 10000, usd: 20   },
};

// Mínimo para canjear fichas por WLD
export const REDEEM_MIN_FICHAS = 2000;

// Fichas por USD para canje (misma tasa que paquete "basic": 300 fichas/$1)
export const FICHAS_PER_USD = 300;

export function spinResult() {
  const index = Math.floor(Math.random() * SECTIONS.length);
  return { index, section: SECTIONS[index] };
}

export function calcWin(bets, section) {
  const color = section.name.toLowerCase();
  if (color === "negro") return 0;
  const bet = bets[color] ?? 0;
  return bet > 0 ? Math.floor(bet * section.multiplier) : 0;
}

export function totalBet(bets) {
  return (bets.rojo ?? 0) + (bets.azul ?? 0) + (bets.blanco ?? 0);
}
