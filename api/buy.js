import supabase from "./lib/supabase.js";
import { PACKAGES } from "./lib/game.js";

// POST /api/buy  { wallet, packageId, txHash? }
// Acredita fichas tras una compra con WLD.
// txHash es el hash de la tx WLD — se guarda para auditoría.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  const { wallet, packageId, txHash } = req.body ?? {};
  if (!wallet || !packageId) return res.status(400).json({ ok: false, message: "Faltan wallet o packageId" });

  const pkg = PACKAGES[packageId];
  if (!pkg) return res.status(400).json({ ok: false, message: "Paquete inválido" });

  // Paquete starter solo una vez por wallet
  if (packageId === "starter") {
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("wallet", wallet)
      .eq("type", "bonus")
      .maybeSingle();

    if (existing) return res.status(400).json({ ok: false, message: "El bono inicial ya fue reclamado" });
  }

  // Evitar doble acreditación con mismo txHash
  if (txHash) {
    const { data: dup } = await supabase
      .from("transactions")
      .select("id")
      .eq("tx_hash", txHash)
      .maybeSingle();

    if (dup) return res.status(400).json({ ok: false, message: "Esta transacción ya fue procesada" });
  }

  // Acreditar fichas al jugador
  const { data: player, error: fetchErr } = await supabase
    .from("players")
    .select("fichas")
    .eq("wallet", wallet)
    .single();

  if (fetchErr) return res.status(404).json({ ok: false, message: "Jugador no encontrado" });

  const newBal = player.fichas + pkg.fichas;

  const [update, tx] = await Promise.all([
    supabase.from("players").update({ fichas: newBal }).eq("wallet", wallet),
    supabase.from("transactions").insert({
      wallet,
      type:    packageId === "starter" ? "bonus" : "buy",
      fichas:  pkg.fichas,
      usd:     pkg.usd,
      tx_hash: txHash ?? null,
    }),
  ]);

  if (update.error) return res.status(500).json({ ok: false, message: "Error acreditando fichas" });

  return res.status(200).json({ ok: true, fichasAdded: pkg.fichas, newBalance: newBal });
}
