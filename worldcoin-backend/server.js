import express from 'express';
import cors from 'cors';
import { verify } from '@worldcoin/idkit';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/verify', async (req, res) => {
  try {
    const { proof, public_signals } = req.body;

    const APP_ID = "app_staging_040375f564177d0137cfac4a180f1464";
    const ACTION_ID = "my_action";

    const verifyResult = await verify(proof, public_signals, {
      app_id: APP_ID,
      action: ACTION_ID,
    });

    if (verifyResult) {
      res.status(200).json({
        success: true,
        message: "Verificación exitosa",
      });
    } else {
      res.status(400).json({ 
        success: false, 
        detail: "Verificación fallida en el servidor" 
      });
    }
  } catch (error) {
    console.error("Error en la verificación del backend:", error);
    res.status(500).json({ 
      success: false, 
      detail: "Error interno del servidor" 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor de verificación de Worldcoin corriendo en http://localhost:${PORT}`);
});