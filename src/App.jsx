import React, { useState } from 'react';
import { IDKitWidget } from '@worldcoin/idkit';
import './App.css'; // Asegúrate de que este archivo de estilos exista

function App() {
  // Esta variable controla si el usuario ha sido verificado.
  const [isVerified, setIsVerified] = useState(false);

  // Esta función se llama cuando la verificación de Worldcoin es exitosa.
  const handleVerify = (result) => {
    // La verificación fue exitosa, cambiamos el estado para mostrar el juego.
    console.log("Verificación exitosa. Resultado:", result);
    setIsVerified(true);
  };

  return (
    <div>
      {/* Usamos el estado 'isVerified' para decidir qué mostrar */}
      {isVerified ? (
        // Si el usuario ya está verificado, muestra la pantalla del juego.
        <div className="game-screen">
          <h1>¡Bienvenido! Ahora puedes jugar a la ruleta.</h1>
          {/* Aquí va el código de tu juego de ruleta */}
        </div>
      ) : (
        // Si no está verificado, muestra el widget de Worldcoin para iniciar la verificación.
        <IDKitWidget
          // **IMPORTANTE**: Reemplaza este valor con tu ID de la aplicación real.
          app_id="app_staging_..." 
          // **IMPORTANTE**: Define una acción única para tu juego.
          action="verificacion_juego" 
          onSuccess={handleVerify}
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