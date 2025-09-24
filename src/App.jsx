import React, { useState } from 'react';
import { IDKitWidget } from '@worldcoin/idkit';
import './App.css';

function App() {
  const [isVerified, setIsVerified] = useState(false);

  // Esta función ahora enviará la prueba al servidor para su verificación.
  const handleVerify = async (result) => {
    try {
      const response = await fetch('http://localhost:3001/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("El servidor confirmó la verificación.");
        setIsVerified(true);
      } else {
        console.error("Error del servidor:", data.message);
      }
    } catch (error) {
      console.error("Error en la conexión con el servidor:", error);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      {isVerified ? (
        <div className="game-screen text-center p-8 bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-4">¡Verificación Exitosa!</h1>
          <p className="text-xl mb-8">Ahora puedes jugar a la ruleta.</p>
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold mb-4">Bienvenido a la Ruleta</h1>
          <p className="text-lg mb-6 text-gray-400">Para jugar, debes verificar tu identidad.</p>
          <IDKitWidget
            app_id="tu_app_id"
            action="verificacion_juego"
            onSuccess={handleVerify}
            title="Verificación de usuario"
            description="Por favor, verifique su identidad para acceder al juego."
          >
            {({ open }) => (
              <button
                onClick={open}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors duration-300"
              >
                Conectarse con Worldcoin
              </button>
            )}
          </IDKitWidget>
        </div>
      )}
    </div>
  );
}

export default App;