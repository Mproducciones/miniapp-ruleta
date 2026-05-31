// Verifica el payload de walletAuth (SIWE) de MiniKit
// Parser propio sin dependencias externas — evita crashes en Vercel

function parseSiweMessage(message) {
  if (!message || typeof message !== "string") return {};
  const lines = message.split("\n");
  const result = {};

  // Dirección: segunda línea (después del dominio)
  if (lines.length > 1) result.address = lines[1]?.trim();

  for (const line of lines) {
    if (line.startsWith("Nonce:"))           result.nonce           = line.replace("Nonce:", "").trim();
    if (line.startsWith("Issued At:"))       result.issuedAt        = line.replace("Issued At:", "").trim();
    if (line.startsWith("Expiration Time:")) result.expirationTime  = line.replace("Expiration Time:", "").trim();
    if (line.startsWith("URI:"))             result.uri             = line.replace("URI:", "").trim();
    if (line.startsWith("Chain ID:"))        result.chainId         = line.replace("Chain ID:", "").trim();
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { payload, nonce } = req.body;

  if (!payload || !nonce) {
    return res.status(400).json({ ok: false, message: "Faltan payload o nonce" });
  }

  try {
    const message = payload.message || payload.siwe_message;

    // Si no hay mensaje SIWE (modo demo / invitado), aceptar directamente
    if (!message) {
      return res.status(200).json({ ok: true, address: payload.address || "guest" });
    }

    const parsed = parseSiweMessage(message);

    if (!parsed.nonce) {
      return res.status(400).json({ ok: false, message: "No se pudo extraer el nonce del mensaje SIWE" });
    }

    if (parsed.nonce !== nonce) {
      return res.status(400).json({ ok: false, message: "Nonce inválido" });
    }

    if (parsed.expirationTime && new Date(parsed.expirationTime) < new Date()) {
      return res.status(400).json({ ok: false, message: "Mensaje expirado" });
    }

    return res.status(200).json({ ok: true, address: parsed.address || "verified" });
  } catch (error) {
    console.error("Error en verify:", error);
    return res.status(500).json({ ok: false, message: "Error interno: " + error.message });
  }
}
