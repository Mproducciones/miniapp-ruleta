import { parseSiweMessage } from "@worldcoin/minikit-js/siwe-exports";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { payload, nonce } = req.body;

  if (!payload || !nonce) {
    return res.status(400).json({ ok: false, message: "Faltan payload o nonce" });
  }

  try {
    // payload.message es el string SIWE firmado por World App
    const message = payload.message || payload.siwe_message || payload;

    if (!message) {
      return res.status(400).json({ ok: false, message: "No se encontró el mensaje SIWE" });
    }

    const parsed = parseSiweMessage(typeof message === "string" ? message : JSON.stringify(message));

    // Verificar que el nonce en el mensaje coincide con el nonce emitido
    if (parsed.nonce !== nonce) {
      return res.status(400).json({ ok: false, message: "Nonce inválido" });
    }

    // Verificar que el mensaje no está expirado (si tiene expiration)
    if (parsed.expirationTime && new Date(parsed.expirationTime) < new Date()) {
      return res.status(400).json({ ok: false, message: "Mensaje expirado" });
    }

    return res.status(200).json({ ok: true, address: parsed.address });
  } catch (error) {
    console.error("Error parsing SIWE message:", error);
    return res.status(500).json({ ok: false, message: "Error al procesar la verificación: " + error.message });
  }
}
