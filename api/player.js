import supabase from "./lib/supabase.js";

// GET  /api/player?wallet=0x...  → devuelve balance actual
// POST /api/player               → { wallet } crea jugador si no existe
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method === "GET") {
    const { wallet } = req.query;
    if (!wallet) return res.status(400).json({ ok: false, message: "Falta wallet" });

    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("wallet", wallet)
      .single();

    if (error && error.code !== "PGRST116") {
      return res.status(500).json({ ok: false, message: error.message });
    }
    return res.status(200).json({ ok: true, player: data ?? null });
  }

  if (req.method === "POST") {
    const { wallet } = req.body ?? {};
    if (!wallet) return res.status(400).json({ ok: false, message: "Falta wallet" });

    // upsert: si ya existe, devuelve el existente sin modificarlo
    const { data, error } = await supabase
      .from("players")
      .upsert({ wallet, fichas: 1000 }, { onConflict: "wallet", ignoreDuplicates: true })
      .select()
      .single();

    if (error) return res.status(500).json({ ok: false, message: error.message });
    return res.status(200).json({ ok: true, player: data });
  }

  return res.status(405).json({ ok: false, message: "Method not allowed" });
}
