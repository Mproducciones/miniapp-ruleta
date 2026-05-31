const APP_ID = process.env.WORLDCOIN_APP_ID || "app_0421a6be5285baa95f9b59b01e75d91c";
const ACTION = process.env.WORLDCOIN_ACTION || "Ruleta game Coins";

// Staging vs production endpoint
const VERIFY_ENDPOINT = APP_ID.startsWith("app_staging_")
  ? `https://staging-developer.worldcoin.org/api/v2/verify/${APP_ID}`
  : `https://developer.worldcoin.org/api/v2/verify/${APP_ID}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { nullifier_hash, merkle_root, proof, verification_level } = req.body;

  if (!nullifier_hash || !merkle_root || !proof) {
    return res.status(400).json({ ok: false, message: "Faltan campos requeridos en la prueba" });
  }

  try {
    const worldcoinRes = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nullifier_hash,
        merkle_root,
        proof,
        verification_level: verification_level || "orb",
        action: ACTION,
      }),
    });

    const data = await worldcoinRes.json();

    if (worldcoinRes.ok) {
      return res.status(200).json({ ok: true, nullifier_hash: data.nullifier_hash });
    } else {
      console.error("Worldcoin verification failed:", data);
      return res.status(400).json({ ok: false, message: data.detail || "Verificación fallida" });
    }
  } catch (error) {
    console.error("Error connecting to Worldcoin:", error);
    return res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
}
