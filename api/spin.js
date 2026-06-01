import supabase from "./lib/supabase.js";
import { spinResult, calcWin, totalBet } from "./lib/game.js";

const MAX_BET = 25; // 0.5% del pozo inicial de 50 WLD

// POST /api/spin  { wallet, bets: { rojo, azul, blanco } }
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  const { wallet, bets } = req.body ?? {};

  if (!wallet || !bets) return res.status(400).json({ ok: false, message: "Faltan wallet o bets" });

  const betRojo   = Math.floor(bets.rojo   ?? 0);
  const betAzul   = Math.floor(bets.azul   ?? 0);
  const betBlanco = Math.floor(bets.blanco ?? 0);
  const total     = betRojo + betAzul + betBlanco;

  if (total <= 0)       return res.status(400).json({ ok: false, message: "Apuesta vacía" });
  if (total > MAX_BET)  return res.status(400).json({ ok: false, message: `Máximo ${MAX_BET} fichas por ronda` });

  // Leer balance actual
  const { data: player, error: fetchErr } = await supabase
    .from("players")
    .select("fichas")
    .eq("wallet", wallet)
    .single();

  if (fetchErr) return res.status(404).json({ ok: false, message: "Jugador no encontrado" });
  if (player.fichas < total) return res.status(400).json({ ok: false, message: "Saldo insuficiente" });

  // Giro server-side — imposible de manipular desde el cliente
  const { index, section } = spinResult();
  const won    = calcWin({ rojo: betRojo, azul: betAzul, blanco: betBlanco }, section);
  const net    = won - total; // positivo = ganó, negativo = perdió
  const newBal = player.fichas + net;

  // Actualizar balance y guardar ronda — en paralelo
  const [balUpdate, roundInsert] = await Promise.all([
    supabase
      .from("players")
      .update({
        fichas:         newBal,
        total_wagered:  supabase.rpc("increment", { x: total, row_id: wallet }), // handled via RPC or manual
      })
      .eq("wallet", wallet),
    supabase.from("rounds").insert({
      wallet,
      bet_rojo:   betRojo,
      bet_azul:   betAzul,
      bet_blanco: betBlanco,
      section:    section.name,
      multiplier: section.multiplier,
      won_fichas: won,
      net_result: net,
    }),
  ]);

  // Si falla el update de balance, no devolver resultado (integridad)
  if (balUpdate.error) return res.status(500).json({ ok: false, message: "Error actualizando balance" });

  // Actualizar total_wagered por separado (simple)
  await supabase
    .from("players")
    .update({ total_wagered: player.fichas }) // se actualiza incremental en DB
    .eq("wallet", wallet);

  return res.status(200).json({
    ok:          true,
    sectionIndex: index,
    section:     section.name,
    multiplier:  section.multiplier,
    won:         won,
    net:         net,
    newBalance:  newBal,
  });
}
