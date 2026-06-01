import supabase from "./lib/supabase.js";
import { REDEEM_MIN_FICHAS, FICHAS_PER_USD } from "./lib/game.js";

// POST /api/redeem  { wallet, fichas }
// Crea una solicitud de canje. El pago WLD se ejecuta desde el pozo
// de forma manual o automatizada por el admin.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  const { wallet, fichas: fichasRaw } = req.body ?? {};
  const fichas = Math.floor(Number(fichasRaw));

  if (!wallet)               return res.status(400).json({ ok: false, message: "Falta wallet" });
  if (!fichas || fichas <= 0) return res.status(400).json({ ok: false, message: "Fichas inválidas" });
  if (fichas < REDEEM_MIN_FICHAS)
    return res.status(400).json({ ok: false, message: `Mínimo ${REDEEM_MIN_FICHAS} fichas para canjear` });

  // Verificar balance
  const { data: player, error: fetchErr } = await supabase
    .from("players")
    .select("fichas")
    .eq("wallet", wallet)
    .single();

  if (fetchErr)              return res.status(404).json({ ok: false, message: "Jugador no encontrado" });
  if (player.fichas < fichas) return res.status(400).json({ ok: false, message: "Saldo insuficiente" });

  const usdValue = fichas / FICHAS_PER_USD;

  // Descontar fichas y crear solicitud de canje — atómico
  const newBal = player.fichas - fichas;

  const [update, tx] = await Promise.all([
    supabase.from("players").update({ fichas: newBal }).eq("wallet", wallet),
    supabase.from("transactions").insert({
      wallet,
      type:    "redeem",
      fichas:  -fichas,       // negativo: salida de fichas
      usd:     usdValue,
      status:  "pending",     // admin lo cambia a 'paid' al enviar WLD
    }),
  ]);

  if (update.error) return res.status(500).json({ ok: false, message: "Error procesando canje" });

  return res.status(200).json({
    ok:         true,
    fichasUsed: fichas,
    usdValue:   usdValue.toFixed(2),
    newBalance: newBal,
    message:    `Solicitud creada. Recibirás ~$${usdValue.toFixed(2)} en WLD en tu wallet.`,
  });
}
