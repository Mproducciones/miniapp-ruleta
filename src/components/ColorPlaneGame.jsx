import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { MiniKit } from '@worldcoin/minikit-js';
import { motion } from "framer-motion";
import "./ColorPlaneGame.css";

/* ===== GANCHO DE SONIDO MEJORADO ===== */
const useSound = (url) => {
  const audioRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, []);

  const play = () => {
    if (typeof window !== 'undefined') {
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
  };

  return play;
};

/* ===== CONFIG ===== */
const INITIAL_PLAYER_BALANCE = 1000.0;
const MAX_HISTORY = 10;
const MAX_BET = 100.0;
const API_URL = ""; // Vacío = rutas relativas (/api/verify), funciona en Vercel y local con proxy

/* ===== SECCIONES RUEDA ===== */
const sections = [
  { hex: "#ff0000", name: "ROJO", multiplier: 1.5 },
  { hex: "#0066ff", name: "AZUL", multiplier: 2 },
  { hex: "#ff0000", name: "ROJO", multiplier: 1.5 },
  { hex: "#ffffff", name: "BLANCO", multiplier: 3 },
  { hex: "#ff0000", name: "ROJO", multiplier: 1.5 },
  { hex: "#0066ff", name: "AZUL", multiplier: 2 },
  { hex: "#ff0000", name: "ROJO", multiplier: 1.5 },
  { hex: "#000000", name: "NEGRO", multiplier: 0 },
  { hex: "#ff0000", name: "ROJO", multiplier: 1.5 },
  { hex: "#0066ff", name: "AZUL", multiplier: 2 },
  { hex: "#ff0000", name: "ROJO", multiplier: 1.5 },
  { hex: "#ffffff", name: "BLANCO", multiplier: 3 },
  { hex: "#ff0000", name: "ROJO", multiplier: 1.5 },
  { hex: "#0066ff", name: "AZUL", multiplier: 2 },
];

/* ===== COLOR HELPERS ===== */
const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : {r:0,g:0,b:0};
};

export default function ColorPlaneGame() {
  const canvasRef = useRef(null);
  const timersRef = useRef([]);
  const pushTimer = (t) => timersRef.current.push(t);

  const SPIN_DUR = 4200;

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [result, setResult] = useState(null);
  const [chipValue, setChipValue] = useState(10);
  const [bets, setBets] = useState({ rojo: 0, azul: 0, blanco: 0 });
  const [lastBets, setLastBets] = useState(null);
  const [playerBalance, setPlayerBalance] = useState(INITIAL_PLAYER_BALANCE);
  const [lightAnimationState, setLightAnimationState] = useState('idle');
  const [history, setHistory] = useState([]);
  const [view, setView] = useState("game");
  const radius = 160;

  const [isVerified, setIsVerified] = useState(false);
  const [toast, setToast] = useState(null);
  const [screenFlash, setScreenFlash] = useState(null);
  const [burstParticles, setBurstParticles] = useState([]);

  // Starfield — generated once
  const stars = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    delay: Math.random() * 6,
    dur: Math.random() * 3 + 2,
    op: Math.random() * 0.5 + 0.2,
  })), []);

  const triggerBurst = useCallback((color) => {
    const count = 22;
    setBurstParticles(Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      angle: (360 / count) * i + Math.random() * 8,
      dist: 55 + Math.random() * 70,
      size: Math.random() * 9 + 4,
      color,
    })));
    setTimeout(() => setBurstParticles([]), 1100);
  }, []);

  const playSpinSound = useSound('/sounds/spin.mp3');
  const playWinSound = useSound('/sounds/win.mp3');
  const playLoseSound = useSound('/sounds/lose.mp3');
  const playBetSound = useSound('/sounds/bet.mp3');

  const wrapText = useCallback((ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(" ");
    let line = "";
    let lines = [];
    if (ctx.measureText(text).width <= maxWidth) {
      lines.push(text);
    } else {
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        if (ctx.measureText(testLine).width > maxWidth && n > 0) {
          lines.push(line);
          line = words[n] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line);
    }
    const totalTextHeight = lines.length * lineHeight;
    let currentY = y - (totalTextHeight / 2) + (lineHeight / 2);
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i].trim(), x, currentY);
      currentY += lineHeight;
    }
  }, []);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = radius, cy = radius;
    const sectionAngle = (2 * Math.PI) / sections.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sections.forEach((sec, i) => {
      const startAngle = i * sectionAngle;
      const endAngle = startAngle + sectionAngle;
      const midAngle = startAngle + sectionAngle / 2;
      const { r, g, b } = hexToRgb(sec.hex);

      // Gradient from lighter center to darker edge
      const grad = ctx.createLinearGradient(
        cx + (radius * 0.25) * Math.cos(midAngle), cy + (radius * 0.25) * Math.sin(midAngle),
        cx + radius * Math.cos(midAngle), cy + radius * Math.sin(midAngle)
      );
      grad.addColorStop(0, `rgba(${Math.min(255,r+70)},${Math.min(255,g+70)},${Math.min(255,b+70)},1)`);
      grad.addColorStop(1, `rgba(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)},1)`);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius - 6, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Multiplier text with glow
      const tx = cx + radius * 0.66 * Math.cos(midAngle);
      const ty = cy + radius * 0.66 * Math.sin(midAngle);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midAngle + Math.PI / 2);
      const isWhite = sec.hex === "#ffffff";
      ctx.fillStyle = isWhite ? "#111" : "#fff";
      ctx.shadowColor = isWhite ? "rgba(0,0,0,0.6)" : `rgba(${r},${g},${b},0.9)`;
      ctx.shadowBlur = 10;
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (sec.multiplier > 0) {
        ctx.fillText(`x${sec.multiplier}`, 0, 0);
      } else {
        ctx.font = "bold 9px Arial";
        ctx.fillText("PIERDE", 0, -6);
        ctx.fillText("TODO", 0, 6);
      }
      ctx.restore();
    });

    // Glossy shine overlay (top-left lighter)
    const gloss = ctx.createRadialGradient(cx * 0.65, cy * 0.45, 0, cx, cy, radius);
    gloss.addColorStop(0, "rgba(255,255,255,0.22)");
    gloss.addColorStop(0.45, "rgba(255,255,255,0.04)");
    gloss.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
    ctx.fillStyle = gloss;
    ctx.fill();

    // Metallic outer ring
    const ringGrad = ctx.createLinearGradient(0, 0, radius * 2, radius * 2);
    ringGrad.addColorStop(0, "rgba(255,255,255,0.95)");
    ringGrad.addColorStop(0.35, "rgba(160,160,160,0.7)");
    ringGrad.addColorStop(0.65, "rgba(80,80,80,0.9)");
    ringGrad.addColorStop(1, "rgba(220,220,220,0.8)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 7;
    ctx.stroke();

    // Center hub — metallic button
    const hubGrad = ctx.createRadialGradient(cx - 7, cy - 7, 1, cx, cy, 30);
    hubGrad.addColorStop(0, "#ffffff");
    hubGrad.addColorStop(0.3, "#dddddd");
    hubGrad.addColorStop(0.7, "#999999");
    hubGrad.addColorStop(1, "#666666");
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [radius, sections]);

  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  useEffect(() => {
    if (view === "game") drawWheel();
  }, [view, rotation, drawWheel]);

  useEffect(() => {
    return () => timersRef.current.forEach((t) => clearTimeout(t));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const pushHistory = (landed, bets, totalWin, losses) => {
    const now = new Date();
    const fecha = now.toLocaleDateString();
    const hora = now.toLocaleTimeString();
    setHistory((h) => {
      const next = [{ landed, bets: {...bets}, totalWin, losses: {...losses}, fecha, hora }, ...h];
      return next.slice(0, MAX_HISTORY);
    });
  };

  const spin = () => {
    const totalBet = bets.rojo + bets.azul + bets.blanco;
    if (spinning) return;
    if (totalBet <= 0) { setToast({ text: "Debes apostar al menos en un color", type: 'info' }); return; }
    if (totalBet > playerBalance) { setToast({ text: "Saldo insuficiente", type: 'info' }); return; }

    setSpinning(true);
    setIsRoundActive(true);
    setResult(null);
    setPlayerBalance((p) => Number((p - totalBet).toFixed(8)));
    setLastBets(bets);
    setLightAnimationState('flicker');
    playSpinSound();

    // El avión orbita varias vueltas + posición aleatoria final
    const randomRotation = 360 * 7 + Math.floor(Math.random() * 360);
    const final = rotation + randomRotation;
    setRotation(final);

    const tEnd = setTimeout(() => {
      // El avión empieza en la cima (12 en punto = 270° en canvas)
      // Después de rotar `normalized` grados horario, está en canvas angle (270 + normalized) % 360
      const normalized = (final % 360 + 360) % 360;
      const sectionSize = 360 / sections.length;
      const canvasAngle = (270 + normalized) % 360;
      const index = Math.floor(canvasAngle / sectionSize) % sections.length;
      const landed = sections[index];
      setResult(landed);

      let totalWin = 0;
      let losses = {};
      const landedColor = landed.name.toLowerCase();

      if (landedColor === "rojo" && bets.rojo > 0)   totalWin = bets.rojo * landed.multiplier;
      else if (landedColor === "azul" && bets.azul > 0)   totalWin = bets.azul * landed.multiplier;
      else if (landedColor === "blanco" && bets.blanco > 0) totalWin = bets.blanco * landed.multiplier;

      if (landedColor !== "rojo")  losses.rojo = bets.rojo;
      if (landedColor !== "azul")  losses.azul = bets.azul;
      if (landedColor !== "blanco") losses.blanco = bets.blanco;
      if (landedColor === "negro") { losses.rojo = bets.rojo; losses.azul = bets.azul; losses.blanco = bets.blanco; }

      if (landed.name === "NEGRO") {
        playLoseSound();
        triggerBurst("#333333");
        setScreenFlash({ color: "rgba(80,0,0,0.6)", key: Date.now() });
        setToast({ text: "Cayó NEGRO 😢 Pierdes todas las apuestas", type: 'lose' });
      } else if (totalWin > 0) {
        setPlayerBalance((p) => Number((p + totalWin).toFixed(8)));
        playWinSound();
        triggerBurst(landed.hex);
        setScreenFlash({ color: landed.hex === '#ffffff' ? 'rgba(200,200,200,0.4)' : `${landed.hex}55`, key: Date.now() });
        setToast({ text: `✅ Ganaste ${totalWin.toFixed(0)} pts en ${landed.name}!`, type: 'win' });
      } else {
        playLoseSound();
        triggerBurst("#444");
        setScreenFlash({ color: "rgba(60,0,0,0.5)", key: Date.now() });
        setToast({ text: "❌ Perdiste esta ronda.", type: 'lose' });
      }

      pushHistory(landed, bets, totalWin, losses);
      setLightAnimationState('on');

      const tFinish = setTimeout(() => {
        setSpinning(false);
        setBets({ rojo: 0, azul: 0, blanco: 0 });
        setIsRoundActive(false);
        setLightAnimationState('idle');
      }, 1800);
      pushTimer(tFinish);
    }, SPIN_DUR);
    pushTimer(tEnd);
  };

  const addBet = (color) => {
    setBets((prev) => {
      const total = prev.rojo + prev.azul + prev.blanco + chipValue;
      if (total > MAX_BET) {
        setToast({ text: `Máximo ${MAX_BET} puntos en total`, type: 'info' });
        return prev;
      }
      playBetSound();
      return { ...prev, [color]: prev[color] + chipValue };
    });
  };

  const repeatBet = () => {
    if (!lastBets) return;
    setBets(lastBets);
  };

  const doubleBet = () => {
    setBets((prev) => {
      const doubled = {
        rojo: prev.rojo * 2,
        azul: prev.azul * 2,
        blanco: prev.blanco * 2,
      };
      const total = doubled.rojo + doubled.azul + doubled.blanco;
      if (total > MAX_BET) {
        setToast({ text: "El doble supera el límite de apuesta", type: 'info' });
        return prev;
      }
      return doubled;
    });
  };
  
  const clearBets = () => {
    setBets({ rojo: 0, azul: 0, blanco: 0 });
  };

  const lightVariants = {
    idle: { opacity: 0.8, filter: 'brightness(0.7)' },
    on: { opacity: 1, filter: 'brightness(1.2)' },
    flicker: {
      opacity: [1, 0.7, 1],
      filter: ['brightness(1.5)', 'brightness(1.0)', 'brightness(1.5)'],
      transition: {
        duration: 0.3,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut"
      }
    }
  };
  const lightTransition = { duration: 0.2, ease: "easeInOut" };

  const renderView = () => {
    if (view === "historial") {
      return (
        <div
          style={{
            width: "100%",
            maxWidth: 520,
            marginTop: 16,
            background: "#fff",
            padding: 12,
            borderRadius: 8,
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}
        >
          <h3 style={{ marginBottom: 12 }}>📜 Historial completo</h3>
          {history.length === 0 && <p>No hay partidas aún</p>}
          {history.map((h, i) => {
            const ganancia = h.totalWin;
            const perdida = Object.values(h.losses).reduce((a, b) => a + b, 0);
            const won = ganancia > 0;
            return (
              <div
                key={i}
                style={{
                  marginBottom: 8,
                  padding: 10,
                  borderRadius: 6,
                  background: won
                    ? "rgba(0,200,0,0.08)"
                    : "rgba(200,0,0,0.08)",
                  border: "1px solid #ddd",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 20,
                      height: 20,
                      background: h.landed.hex,
                      border: "1px solid #222",
                      marginRight: 8,
                    }}
                  />
                  <strong>{h.landed.name}</strong>
                  <span style={{ marginLeft: 8 }}>
                    {won
                      ? `✅ Ganaste ${ganancia.toFixed(0)} puntos`
                      : `❌ Perdiste ${perdida.toFixed(0)} puntos`}
                  </span>
                </div>
                <div style={{ fontSize: 14, color: "#555", marginTop: 4 }}>
                  Apuesta: {h.bets.rojo.toFixed(0)}R, {h.bets.azul.toFixed(0)}A, {h.bets.blanco.toFixed(0)}B
                </div>
                <small style={{ color: "#555" }}>
                  {h.fecha} - {h.hora}
                </small>
              </div>
            );
          })}
          <button
            style={{
              marginTop: 16,
              padding: "8px 14px",
              borderRadius: 6,
              background: "#eee",
            }}
            onClick={() => setView("game")}
          >
            🔙 Volver al juego
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at top, #0d0d2b 0%, #030310 60%)", padding: "16px 16px 32px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden" }}>

      {/* Starfield */}
      {stars.map(s => (
        <div key={s.id} className="star" style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, '--dur': `${s.dur}s`, '--delay': `${s.delay}s`, '--base-op': s.op }} />
      ))}

      {/* Screen flash overlay */}
      {screenFlash && (
        <div key={screenFlash.key} className="screen-flash" style={{ background: `radial-gradient(circle, ${screenFlash.color} 0%, transparent 70%)` }} />
      )}

      <img src="/assets/logo.png" alt="logo" style={{ width: "85%", maxWidth: 320, marginTop: 8, position: "relative", zIndex: 2, filter: "drop-shadow(0 0 12px rgba(255,200,0,0.5))" }} />

      {!isVerified ? (
        <div style={{ padding: '20px', textAlign: 'center', marginTop: 50, background: 'rgba(0,0,0,0.5)', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
          <h2 style={{ color: '#fff', fontSize: '24px' }}>¡Bienvenido! 👋</h2>

          {MiniKit.isInstalled() ? (
            <>
              <p style={{ color: '#ddd', marginBottom: '20px' }}>Verifica tu identidad con World ID para jugar.</p>
              <button
                onClick={async () => {
                  try {
                    const nonceRes = await fetch(`${API_URL}/api/nonce`);
                    const { nonce } = await nonceRes.json();

                    const result = await MiniKit.walletAuth({
                      nonce,
                      statement: 'Verifica tu identidad para jugar a Avión de Colores',
                    });

                    if (result.data?.status === 'error') {
                      setToast({ text: 'Verificación cancelada.', type: 'lose' });
                      return;
                    }

                    const res = await fetch(`${API_URL}/api/verify`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ payload: result.data, nonce }),
                    });
                    const data = await res.json();
                    if (res.ok && data.ok) {
                      setIsVerified(true);
                    } else {
                      setToast({ text: data.message || 'Verificación fallida.', type: 'lose' });
                    }
                  } catch (err) {
                    console.error('Verify error:', err);
                    setToast({ text: `Error: ${err.message || 'Inténtalo de nuevo.'}`, type: 'lose' });
                  }
                }}
                style={{ padding: '12px 24px', background: '#1c74d6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
              >
                Verificar con World ID
              </button>
            </>
          ) : (
            <>
              <p style={{ color: '#ddd', marginBottom: '8px' }}>Para verificación completa, abre esta app dentro de <strong style={{ color: '#fff' }}>World App</strong>.</p>
              <p style={{ color: '#aaa', fontSize: 13, marginBottom: '20px' }}>O continúa como invitado para probar el juego.</p>
              <button
                onClick={() => setIsVerified(true)}
                style={{ padding: '12px 24px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'block', margin: '0 auto 12px' }}
              >
                Jugar como invitado
              </button>
              <a
                href={`https://worldcoin.org/mini-app?app_id=app_0421a6be5285baa95f9b59b01e75d91c`}
                style={{ color: '#60a5fa', fontSize: 13 }}
              >
                Abrir en World App →
              </a>
            </>
          )}
        </div>
      ) : (
        <>
          {view === "game" && (
            <>
              {/* ===== WHEEL SECTION ===== */}
              <div style={{ perspective: "900px", marginTop: 12, width: "92%", maxWidth: 390, zIndex: 2, position: "relative" }}>
                <motion.div
                  animate={{ rotateX: spinning ? 14 : 0, scale: spinning ? 1.04 : 1 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ transformStyle: "preserve-3d", position: "relative" }}
                >
                  {/* Rainbow neon ring */}
                  <div className={`wheel-ring${spinning ? " spinning" : ""}`} />

                  {/* Speed rings during spin */}
                  {spinning && [0,1,2].map(i => (
                    <div key={i} className="speed-ring" style={{ '--delay': `${i * 0.38}s` }} />
                  ))}

                  {/* Fixed canvas wheel with glow */}
                  <div style={{
                    width: "100%", aspectRatio: "1",
                    filter: spinning
                      ? "drop-shadow(0 0 18px rgba(255,200,0,0.75)) drop-shadow(0 0 45px rgba(255,100,0,0.45))"
                      : "drop-shadow(0 0 6px rgba(255,200,0,0.2))",
                    transition: "filter 0.6s",
                  }}>
                    <canvas ref={canvasRef} width={radius * 2} height={radius * 2} style={{ width: "100%", height: "100%" }} />
                  </div>

                  {/* Roulette lights */}
                  <motion.img
                    src="/assets/roulette_lights_only.png" alt="Luces"
                    variants={lightVariants} animate={lightAnimationState}
                    transition={lightTransition} initial="idle"
                    style={{ position: "absolute", top: -20, left: -23, width: "111%", height: "111%", pointerEvents: "none", zIndex: 15 }}
                  />

                  {/* Particle burst */}
                  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 30 }}>
                    {burstParticles.map(p => (
                      <div key={p.id} className="burst-particle" style={{
                        width: p.size, height: p.size,
                        background: p.color,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size * 4}px ${p.color}55`,
                        '--tx': `${Math.cos(p.angle * Math.PI / 180) * p.dist}px`,
                        '--ty': `${Math.sin(p.angle * Math.PI / 180) * p.dist}px`,
                      }} />
                    ))}
                  </div>

                  {/* Orbital container — carries the plane */}
                  <motion.div
                    animate={{ rotate: rotation }}
                    transition={{ duration: SPIN_DUR / 1000, ease: "easeOut" }}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 20 }}
                  >
                    {/* Comet trail when spinning */}
                    {spinning && (
                      <div className="plane-trail" style={{ position: "absolute", top: "5%", left: "calc(50% - 2px)", transformOrigin: "center bottom" }} />
                    )}
                    {/* Plane */}
                    <img
                      src="/assets/plane.png" alt="avion"
                      style={{
                        position: "absolute", top: "-8%", left: "50%",
                        transform: "translateX(-50%) rotate(-90deg)",
                        width: "22%", maxWidth: 90,
                        filter: spinning
                          ? "drop-shadow(0 0 8px rgba(255,220,0,0.95)) drop-shadow(0 0 22px rgba(255,100,0,0.7))"
                          : "drop-shadow(0 0 4px rgba(255,200,0,0.4))",
                        transition: "filter 0.4s",
                      }}
                    />
                  </motion.div>

                  {/* Center spin button */}
                  <button
                    onClick={spin}
                    disabled={spinning || isRoundActive}
                    className={`spin-btn ${spinning ? "spinning" : "idle"}`}
                  >
                    {spinning ? "..." : "GIRAR"}
                  </button>
                </motion.div>
              </div>

              {/* ===== HUD BALANCE ===== */}
              <div style={{ marginTop: 14, textAlign: "center", zIndex: 2 }}>
                <div style={{ fontSize: 11, color: "rgba(255,230,100,0.6)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 2 }}>Saldo</div>
                <div className="hud-balance">{playerBalance.toFixed(0)} <span style={{ fontSize: 14 }}>PTS</span></div>
              </div>

              {/* ===== CHIP SELECTOR ===== */}
              <div className="chip-selector" style={{ display: "flex", gap: 8, marginTop: 14, zIndex: 2 }}>
                {[10, 50, 100].map(val => (
                  <button key={val} className={chipValue === val ? "active" : ""} onClick={() => setChipValue(val)}>
                    {val} pts
                  </button>
                ))}
              </div>

              {/* ===== BET CHIPS ===== */}
              <div style={{ display: "flex", gap: 14, marginTop: 14, zIndex: 2 }}>
                <motion.button
                  className="chip-btn chip-red"
                  onClick={() => addBet("rojo")}
                  whileTap={{ scale: 0.88, y: 4 }}
                  disabled={spinning}
                >
                  <span>ROJO</span>
                  <span style={{ fontSize: 12 }}>x1.5</span>
                  <span className="bet-badge">{bets.rojo > 0 ? `+${bets.rojo}` : "—"}</span>
                </motion.button>

                <motion.button
                  className="chip-btn chip-blue"
                  onClick={() => addBet("azul")}
                  whileTap={{ scale: 0.88, y: 4 }}
                  disabled={spinning}
                >
                  <span>AZUL</span>
                  <span style={{ fontSize: 12 }}>x2</span>
                  <span className="bet-badge">{bets.azul > 0 ? `+${bets.azul}` : "—"}</span>
                </motion.button>

                <motion.button
                  className="chip-btn chip-white"
                  onClick={() => addBet("blanco")}
                  whileTap={{ scale: 0.88, y: 4 }}
                  disabled={spinning}
                >
                  <span>BLANCO</span>
                  <span style={{ fontSize: 12 }}>x3</span>
                  <span className="bet-badge">{bets.blanco > 0 ? `+${bets.blanco}` : "—"}</span>
                </motion.button>
              </div>

              {/* ===== CONTROL BUTTONS ===== */}
              <div style={{ display: "flex", gap: 8, marginTop: 12, zIndex: 2 }}>
                <button className="ctrl-btn" onClick={repeatBet} disabled={spinning}>🔄 Repetir</button>
                <button className="ctrl-btn" onClick={doubleBet} disabled={spinning}>✖2 Doblar</button>
                <button className="ctrl-btn" onClick={clearBets} disabled={spinning}>✕ Cero</button>
              </div>

              {/* ===== HISTORY DOTS ===== */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", marginTop: 18, zIndex: 2 }}>
                {history.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Sin partidas aún</p>}
                {!isRoundActive && history.map((h, i) => (
                  <div key={i} className="hist-dot" onClick={() => setView("historial")}
                    style={{ background: h.landed.hex, boxShadow: `0 0 8px ${h.landed.hex}` }} />
                ))}
              </div>
            </>
          )}
          {renderView()}
        </>
      )}
      {toast && (
        <div
          onClick={() => setToast(null)}
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            background: "rgba(0,0,0,0.55)",
          }}
        >
          <div
            style={{
              background: toast.type === 'win' ? "#1a7a1a" : toast.type === 'lose' ? "#7a1a1a" : "#333",
              color: "#fff",
              padding: "28px 36px",
              borderRadius: 16,
              fontSize: 22,
              fontWeight: "bold",
              textAlign: "center",
              maxWidth: 320,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            {toast.text}
            <div style={{ fontSize: 14, fontWeight: "normal", marginTop: 14, opacity: 0.8 }}>
              Toca para continuar
            </div>
          </div>
        </div>
      )}
    </div>
  );
}