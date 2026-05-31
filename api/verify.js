import { verifySiweMessage } from "@worldcoin/minikit-js/siwe-exports";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  const { payload, nonce } = req.body;

  if (!payload || !nonce) {
    return res.status(400).json({ ok: false, message: "Faltan payload o nonce" });
  }

  try {
    const validMessage = await verifySiweMessage(payload, nonce);

    if (!validMessage.isValid) {
      return res.status(400).json({ ok: false, message: "Firma SIWE inválida" });
    }

    return res.status(200).json({ ok: true, address: validMessage.siweMessageData.address });
  } catch (error) {
    console.error("Error verifying SIWE:", error);
    return res.status(500).json({ ok: false, message: "Error al verificar la firma" });
  }
}
