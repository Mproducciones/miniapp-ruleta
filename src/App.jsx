import React, { useState } from 'react';
import { IDKitWidget } from '@worldcoin/idkit';
import './App.css'; 

// Asume que tu componente de la ruleta se llama RouletteGame
// import RouletteGame from './components/RouletteGame'; 

function App() {
  const [isVerified, setIsVerified] = useState(false);

  return (
    <div>
      {isVerified ? (
        // Si el usuario está verificado, muestra el juego completo
        <div>
          <p>¡Bienvenido! Ahora puedes jugar a la ruleta.</p>
          {/* <RouletteGame /> */}
        </div>
      ) : (
        // Si no está verificado, muestra la pantalla de bienvenida con el botón
        <IDKitWidget
          app_id="¡K4$!n0" // Reemplaza esto con tu ID
          onSuccess={() => setIsVerified(true)}
          // ...otras configuraciones...
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