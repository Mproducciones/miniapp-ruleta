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
        // Si el usuario está verificado, muestra el juego completo
        <div>
          <p>¡Bienvenido! Ahora puedes jugar a la ruleta.</p>
        </div>
      ) : (
        // Si no está verificado, muestra la pantalla de bienvenida con el botón
        <IDKitWidget
          app_id="tu_app_id"
          onSuccess={handleVerify}
          // action="verify"
        >
          {({ open }) => (
            <div>
              <h1>Bienvenido a la Ruleta</h1>
              <p>Para jugar, debes verificar tu identidad.</p>
              <button onClick={open}>Conectarse con Worldcoin</button>
            </div>
          )}
        </IDKitWidget>
      )}
    </div>
  );
}

export default App;