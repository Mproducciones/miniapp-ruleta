import React, { useState } from 'react';
import { IDKitWidget } from '@worldcoin/idkit';
import './App.css'; 

function App() {
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = (result) => {
    console.log("Verificación exitosa. Resultado:", result);
    setIsVerified(true);
  };

  return (
    <div>
      {isVerified ? (
        <div className="game-screen">
          <h1>¡Bienvenido! Ahora puedes jugar a la ruleta.</h1>
          {/* Aquí va el código de tu juego */}
        </div>
      ) : (
        <IDKitWidget
          app_id="tu_app_id"
          action="verificacion_juego"
          onSuccess={handleVerify}
          // Agrega las siguientes líneas para solucionar la advertencia de accesibilidad
          title="Verificación de usuario"
          description="Por favor, verifique su identidad para acceder al juego."
        >
          {({ open }) => (
            <div className="welcome-screen">
              <h1>Bienvenido a la Ruleta</h1>
              <p>Para jugar, debes verificar tu identidad.</p>
              <button onClick={open}>
                Conectarse con Worldcoin
              </button>
            </div>
          )}
        </IDKitWidget>
      )}
    </div>
  );
}

export default App;