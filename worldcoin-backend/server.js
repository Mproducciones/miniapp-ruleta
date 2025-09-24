import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/verify", async (req, res) => {
  try {
    const { proof, nullifier_hash, merkle_root, signal } = req.body;

    // Llamada a la API de Worldcoin
    const response = await fetch("https://developer.worldcoin.org/api/v1/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: "app_d1ea58fce8cb903e9be8b8dbf34da3a2", // copia el App ID de tu Worldcoin Dev Portal
        action: "login",        // mismo "action" que usas en tu IDKitWidget
        signal: signal || "default-signal",  // opcional, puede ser un userID o algo que identifique la sesión
        proof,
        nullifier_hash,
        merkle_root
      }),
    });

    const data = await response.json();
    console.log("🔎 Respuesta de Worldcoin:", data);

    if (data.success) {
      res.json({ ok: true, data });
    } else {
      res.status(400).json({ ok: false, error: data });
    }
  } catch (err) {
    console.error("❌ Error en el servidor:", err);
    res.status(500).json({ ok: false, message: "Error interno del servidor" });
  }
});

app.listen(3001, () => {
  console.log("✅ Backend corriendo en http://localhost:3001");
});
