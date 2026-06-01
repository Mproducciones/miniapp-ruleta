-- ============================================================
--  AVIÓN DE COLORES — Schema Supabase
--  Ejecutar en: Supabase → SQL Editor → New query
-- ============================================================

-- Jugadores
CREATE TABLE IF NOT EXISTS players (
  wallet         TEXT PRIMARY KEY,
  fichas         INTEGER NOT NULL DEFAULT 1000,
  total_wagered  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Rondas (historial de giros)
CREATE TABLE IF NOT EXISTS rounds (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet      TEXT NOT NULL REFERENCES players(wallet) ON DELETE CASCADE,
  bet_rojo    INTEGER NOT NULL DEFAULT 0,
  bet_azul    INTEGER NOT NULL DEFAULT 0,
  bet_blanco  INTEGER NOT NULL DEFAULT 0,
  section     TEXT NOT NULL,
  multiplier  DECIMAL(4,2) NOT NULL,
  won_fichas  INTEGER NOT NULL DEFAULT 0,
  net_result  INTEGER NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Transacciones (compras, canjes, bonos)
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet      TEXT NOT NULL REFERENCES players(wallet) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('buy', 'bonus', 'redeem')),
  fichas      INTEGER NOT NULL,
  usd         DECIMAL(10,2),
  tx_hash     TEXT UNIQUE,
  status      TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_rounds_wallet    ON rounds(wallet);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON transactions(wallet);

-- RLS: solo el service key del backend puede leer/escribir
ALTER TABLE players      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds        ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions  ENABLE ROW LEVEL SECURITY;

-- Políticas: acceso completo solo vía service key (backend)
CREATE POLICY "service_full_access_players"      ON players      FOR ALL USING (true);
CREATE POLICY "service_full_access_rounds"       ON rounds       FOR ALL USING (true);
CREATE POLICY "service_full_access_transactions" ON transactions FOR ALL USING (true);
