import { IDKitWidget } from '@worldcoin/idkit';
import { useState } from 'react';
import './App.css'; // Asegúrate de que el archivo de estilos exista

function App() {
  const [showWorldCoin, setShowWorldCoin] = useState(false);

  return (
    <div>
      {/* Tu juego de ruleta va aquí. Asegúrate de que esté visible. */}
      {/* Por ejemplo: */}
      <h1>¡Bienvenido a la Ruleta!</h1>
      {/* <RouletteGame /> */}

      {/* Este botón o lógica solo aparece cuando el usuario quiere apostar. */}
      {showWorldCoin ? (
        <IDKitWidget
          app_id="app_staging_..." // Reemplaza esto con tu ID
          onSuccess={() => {/* Lógica para apostar */}}
        >
          {({ open }) => <button onClick={open}>Verificar y Apostar</button>}
        </IDKitWidget>
      ) : (
        <button onClick={() => setShowWorldCoin(true)}>
          Verificar y Apostar
        </button>
      )}
    </div>
  );
}

export default App; // Asegúrate de que esta línea esté al final