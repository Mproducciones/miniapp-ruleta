﻿import React, { useState } from 'react';
// IMPORTANTE:
// Para que esto funcione, necesitas instalar la biblioteca de IDKit en tu proyecto local
// ejecutando: npm install @worldcoin/idkit
// La siguiente línea debe estar descomentada en tu entorno local:
// import { IDKitWidget } from '@worldcoin/idkit';

function App() {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState("Por favor, verifique su identidad para acceder al juego.");

  // Esta función es llamada por el widget de Worldcoin y se encarga de enviar la prueba
  // al servidor de backend para su validación final.
  const handleVerify = async (result) => {
    setIsVerifying(true);
    setMessage("Verificando con el servidor...");

    try {
      const response = await fetch('http://localhost:3001/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        console.log("✅ El servidor confirmó la verificación.");
        setIsVerified(true);
        setMessage("¡Verificación Exitosa!");
      } else {
        console.error("❌ Error del servidor:", data.message);
        setMessage("La verificación falló. Inténtalo de nuevo.");
      }
    } catch (error) {
      console.error("❌ Error en la conexión con el servidor:", error);
      setMessage("Error de conexión. Asegúrate de que tu backend está corriendo.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      {isVerified ? (
        <div className="game-screen text-center p-8 bg-gray-900 min-h-screen text-white flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold mb-4">¡Verificación Exitosa!</h1>
          <p className="text-xl mb-8">Ahora puedes jugar a la ruleta.</p>
          <img src="https://placehold.co/200x200/5eead4/000000?text=JUEGO" alt="Ruleta del Juego" className="rounded-full shadow-lg" />
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl">
          <h1 className="text-3xl font-bold mb-4">Bienvenido a la Ruleta</h1>
          <p className="text-lg mb-6 text-gray-400">{message}</p>
          
          {/* El siguiente código está comentado para que la aplicación funcione en este entorno. */}
          {/* En tu entorno local, si tienes instalado IDKit, puedes usar este código en su lugar. */}
          {/* <IDKitWidget
            app_id="app_d1ea58fce8cb903e9be8b8dbf34da3a2"
            action="login"
            onSuccess={handleVerify}
            title="Verificación de usuario"
            description="Por favor, verifique su identidad para acceder al juego."
          >
            {({ open }) => (
              <button
                onClick={open}
                disabled={isVerifying}
                className={`px-6 py-3 font-semibold rounded-full transition-colors duration-300 ${
                  isVerifying
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isVerifying ? 'Verificando...' : 'Conectarse con Worldcoin'}
              </button>
            )}
          </IDKitWidget> */}
          
          {/* Botón de simulación que se usa en este entorno. */}
          <button
            onClick={() => handleVerify({})} 
            disabled={isVerifying}
            className={`px-6 py-3 font-semibold rounded-full transition-colors duration-300 ${
              isVerifying
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isVerifying ? 'Verificando...' : 'Conectarse con Worldcoin'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
