export default function App() {
  const [showWorldCoin, setShowWorldCoin] = useState(false);
  
  return (
    <div>
      <RouletteGame /> {/* Muestra el juego desde el principio */}

      {/* Solo muestra el botón para verificar con Worldcoin */}
      {showWorldCoin ? (
        <WorldIDKit
          // ...configuración...
          onSuccess={() => {/* Lógica para apostar */}}
        />
      ) : (
        <button onClick={() => setShowWorldCoin(true)}>
          Verificar y Apostar
        </button>
      )}
    </div>
  );
}