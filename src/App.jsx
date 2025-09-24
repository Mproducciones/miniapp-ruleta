import React, { useState } from "react";
import { IDKitWidget } from "@worldcoin/idkit";
import ColorPlaneGame from "./ColorPlaneGame.js"; // tu componente actual del juego (el que pegaste)

export default function App() {
  const [verified, setVerified] = useState(false);

  const onSuccess = (proof) => {
    console.log("✅ Verificación exitosa:", proof);
    setVerified(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      {!verified ? (
        <div className="text-center p-6 bg-gray-800 rounded-xl shadow-lg max-w-md">
          <img
            src="/assets/logo.png"
            alt="logo"
            className="w-40 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-teal-400 mb-2">
            Verifícate para jugar
          </h1>
          <p className="text-gray-300 mb-6">
            Debes comprobar tu identidad con World ID antes de comenzar el
            juego.
          </p>

          <div className="flex flex-col gap-4">
            <IDKitWidget
              action="avion-play" // id de tu acción en worldcoin dev portal
              app_id="tu-app-id-aqui" // remplaza con tu APP ID de Worldcoin
              onSuccess={onSuccess}
            >
              {({ open }) => (
                <button
                  onClick={open}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-lg transition transform hover:scale-105"
                >
                  🔐 Verificar con World ID
                </button>
              )}
            </IDKitWidget>

            {/* Botón de modo prueba para desarrollo */}
            <button
              onClick={() => setVerified(true)}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg shadow-lg transition transform hover:scale-105"
            >
              🛠️ Modo Prueba
            </button>
          </div>
        </div>
      ) : (
        <ColorPlaneGame />
      )}
    </div>
  );
}
