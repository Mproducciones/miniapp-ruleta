import React, { useState } from "react";
import "./Game.css";
import plane from "../assets/plane.png"; // avión cargado en assets
import wheel from "../assets/wheel.png"; // si usas una imagen base, opcional

const COLORS = [
  { name: "Rojo", hex: "#ff0000" },
  { name: "Azul", hex: "#0066ff" },
  { name: "Blanco", hex: "#ffffff" },
  { name: "Negro", hex: "#000000" }, // pierde
];

export default function Game() {
  const [bet, setBet] = useState(null);
  const [result, setResult] = useState(null);
  const [ranking, setRanking] = useState([]);

  const handlePlay = () => {
    const allColors = [
      "Rojo",
      "Azul",
      "Blanco",
      "Negro",
      "Rojo",
      "Azul",
      "Blanco",
      "Negro",
    ];
    const random = allColors[Math.floor(Math.random() * allColors.length)];

    setResult(random);

    if (bet === random) {
      setRanking((prev) => [...prev, `Ganaste con ${random}`]);
    } else if (random === "Negro") {
      setRanking((prev) => [...prev, "Perdiste: salió Negro"]);
    } else {
      setRanking((prev) => [...prev, `Perdiste: salió ${random}`]);
    }
  };

  return (
    <div className="game-container">
      <h2 className="title">🎮 Avión de Colores</h2>

      <div className="play-area">
        {/* Ruleta */}
        <div className="wheel">
          {COLORS.map((c, i) => (
            <div
              key={i}
              className="wheel-segment"
              style={{ backgroundColor: c.hex }}
            >
              {c.name}
            </div>
          ))}
        </div>

        {/* Avión al costado */}
        <img src={plane} alt="Plane" className="plane" />
      </div>

      {/* Apuestas */}
      <div className="bets">
        <h3>Apostar</h3>
        {["Rojo", "Azul", "Blanco"].map((color) => (
          <button
            key={color}
            onClick={() => setBet(color)}
            className={bet === color ? "selected" : ""}
          >
            {color}
          </button>
        ))}
      </div>

      {/* Resultado */}
      <div className="result">
        <p>
          Resultado:{" "}
          {result ? <strong>{result}</strong> : "Esperando jugada..."}
        </p>
        <button onClick={handlePlay}>Jugar</button>
      </div>

      {/* Ranking */}
      <div className="ranking">
        <h3>Ranking</h3>
        <ul>
          {ranking.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
