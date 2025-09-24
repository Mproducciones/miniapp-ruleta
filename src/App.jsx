import React, { useState } from 'react';
// Nota: Las bibliotecas externas como '@worldcoin/idkit' no se pueden importar directamente en este entorno.
// He modificado el código para simular la funcionalidad del widget.

function App() {
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('Por favor, verifique su identidad para acceder al juego.');

  // Esta función simula la llamada a tu servidor para verificar la prueba.
  // En tu código real, esta función se activaría con el "onSuccess" del IDKitWidget.
  const handleVerify = async (result) => {
    setIsVerifying(true);
    setMessage('Verificando con el servidor...');

    // Simulamos la llamada a tu backend. En un entorno real, aquí se usaría `fetch`.
    // Por ejemplo: await fetch('http://localhost:3001/api/verify', { ... });
    try {
      // Simulación de una respuesta exitosa del servidor después de 2 segundos.
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log("El servidor confirmó la verificación.");
      setIsVerified(true);
      setMessage('¡Verificación Exitosa!');
    } catch (error) {
      console.error("Error en la conexión con el servidor:", error);
      setMessage('Verificación fallida. Por favor, inténtelo de nuevo.');
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
          
          {/* Aquí se ubicaría el IDKitWidget. 
              Como no se puede importar en este entorno, usamos un botón. */}
          {/* <IDKitWidget
            app_id="app_d1ea58fce8cb903e9be8b8dbf34da3a2"
            action="login"
            onSuccess={handleVerify}
            title="Verificación de usuario"
            description="Por favor, verifique su identidad para acceder al juego."
          >
            {({ open }) => (
              <button onClick={open} disabled={isVerifying} className="...">
                {isVerifying ? 'Verificando...' : 'Conectarse con Worldcoin'}
              </button>
            )}
          </IDKitWidget> */}

          {/* Botón de simulación para reemplazar el widget real */}
          <button
            onClick={handleVerify}
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