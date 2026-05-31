import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { MiniKit } from '@worldcoin/minikit-js';
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import "./ColorPlaneGame.css";

/* ===== GANCHO DE SONIDO ===== */
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
      if (!audioRef.current) audioRef.current = new Audio(url);
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
const API_URL = "";

/* ===== SECCIONES RUEDA ===== */
const sections = [
  { hex: "#ff0000", name: "ROJO",   multiplier: 1.5 },
  { hex: "#0066ff", name: "AZUL",   multiplier: 2   },
  { hex: "#ff0000", name: "ROJO",   multiplier: 1.5 },
  { hex: "#ffffff", name: "BLANCO", multiplier: 3   },
  { hex: "#ff0000", name: "ROJO",   multiplier: 1.5 },
  { hex: "#0066ff", name: "AZUL",   multiplier: 2   },
  { hex: "#ff0000", name: "ROJO",   multiplier: 1.5 },
  { hex: "#000000", name: "NEGRO",  multiplier: 0   },
  { hex: "#ff0000", name: "ROJO",   multiplier: 1.5 },
  { hex: "#0066ff", name: "AZUL",   multiplier: 2   },
  { hex: "#ff0000", name: "ROJO",   multiplier: 1.5 },
  { hex: "#ffffff", name: "BLANCO", multiplier: 3   },
  { hex: "#ff0000", name: "ROJO",   multiplier: 1.5 },
  { hex: "#0066ff", name: "AZUL",   multiplier: 2   },
];

/* ===== COLOR HELPERS ===== */
const hexToRgb = (hex) => {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1],16), g: parseInt(r[2],16), b: parseInt(r[3],16) } : { r:0, g:0, b:0 };
};

/* ===== BUNTING FLAG COLORS ===== */
const BUNTING_COLORS = ["#e8001d","#ffd700","#0052cc","#ff6b00","#4ade80","#a855f7","#e8001d","#ffd700","#0052cc","#ff6b00","#4ade80","#a855f7","#e8001d","#ffd700","#0052cc","#ff6b00"];

/* ===== SHOP PACKAGES =====
   Precio fijo en USD (1 ficha = USD 0.01).
   WLD se calcula en tiempo real al pagar: usdAmount / wldPriceUSD.
   Esto protege de la volatilidad del WLD.
   ============================= */
const FICHA_USD_PRICE = 0.01; // 1 ficha = USD $0.01
const SHOP_PACKAGES = [
  { id: "starter", label: "500 Fichas",  amount: 500,  usd: 0,    desc: "Prueba gratis",  priceClass: "free", wld: null },
  { id: "basic",   label: "1500 Fichas", amount: 1500, usd: 5.00, desc: "USD $5.00",      priceClass: "",     wld: null },
  { id: "plus",    label: "4000 Fichas", amount: 4000, usd: 10.00,desc: "USD $10.00",     priceClass: "",     wld: null },
  { id: "pro",     label: "10000 Fichas",amount: 10000,usd: 20.00,desc: "USD $20.00 🔥",  priceClass: "hot",  wld: null },
];
// Tu dirección de wallet para recibir pagos WLD
const PAYMENT_ADDRESS = "0x0000000000000000000000000000000000000000";

export default function ColorPlaneGame() {
  const canvasRef  = useRef(null);
  const timersRef  = useRef([]);
  const pushTimer  = (t) => timersRef.current.push(t);

  const SPIN_DUR = 4200;

  /* ---- Game state ---- */
  const [rotation,          setRotation]          = useState(0);
  const [spinning,          setSpinning]           = useState(false);
  const [isRoundActive,     setIsRoundActive]      = useState(false);
  const [result,            setResult]             = useState(null);
  const [chipValue,         setChipValue]          = useState(10);
  const [bets,              setBets]               = useState({ rojo: 0, azul: 0, blanco: 0 });
  const [lastBets,          setLastBets]           = useState(null);
  const [playerBalance,     setPlayerBalance]      = useState(INITIAL_PLAYER_BALANCE);
  const [lightAnimationState, setLightAnimationState] = useState('idle');
  const [history,           setHistory]            = useState([]);

  /* ---- UI state ---- */
  const [isVerified,  setIsVerified]  = useState(false);
  const inWorldApp = useMemo(() => MiniKit.isInstalled(), []);
  const [toast,       setToast]       = useState(null);
  const [screenFlash, setScreenFlash] = useState(null);
  const [burstParticles, setBurstParticles] = useState([]);
  const [showShop,    setShowShop]    = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lastWin,     setLastWin]     = useState(null); // { amount, color, name }

  const radius = 160;

  const sectionAngle = 360 / sections.length; // degrees per section

  /* ---- SVG wheel renderer — colores sólidos, sin url(#id) en secciones ---- */
  const WheelSVG = useMemo(() => {
    const cx = 160, cy = 160, r = 152, textR = 100, hubR = 28;
    const toRad = (d) => d * Math.PI / 180;

    // Color sólido directo por nombre — garantizado visible en cualquier navegador
    const solidColor = (sec) => {
      if (sec.name === "NEGRO")  return "#1a1a4e";
      if (sec.name === "BLANCO") return "#f0f0e8";
      if (sec.name === "AZUL")   return "#0055ff";
      return "#ee0000"; // ROJO
    };

    return (
      <svg viewBox="0 0 320 320" width="100%" height="100%" style={{ display: "block" }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="wg-gloss" cx="38%" cy="30%" r="65%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.30" />
            <stop offset="50%"  stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
          </radialGradient>
          <radialGradient id="wg-hub" cx="35%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="40%"  stopColor="#dddddd" />
            <stop offset="100%" stopColor="#888888" />
          </radialGradient>
        </defs>

        {/* Secciones — fill sólido sin url() interno */}
        {sections.map((sec, i) => {
          const a0 = toRad(i * sectionAngle);
          const a1 = toRad((i + 1) * sectionAngle);
          const x1 = cx + r * Math.cos(a0), y1 = cy + r * Math.sin(a0);
          const x2 = cx + r * Math.cos(a1), y2 = cy + r * Math.sin(a1);
          const large = sectionAngle > 180 ? 1 : 0;
          return (
            <path key={i}
              d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`}
              fill={solidColor(sec)}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Brillo glossy encima — usa defs del nivel SVG, siempre funciona */}
        <circle cx={cx} cy={cy} r={r} fill="url(#wg-gloss)" />

        {/* Borde */}
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />

        {/* Etiquetas */}
        {sections.map((sec, i) => {
          const mid = toRad((i + 0.5) * sectionAngle);
          const tx  = cx + textR * Math.cos(mid);
          const ty  = cy + textR * Math.sin(mid);
          const rot = (i + 0.5) * sectionAngle + 90;
          const isLight = sec.name === "BLANCO";
          const tf  = isLight ? "#111111" : "#ffffff";
          return (
            <g key={`t${i}`} transform={`translate(${tx},${ty}) rotate(${rot})`}>
              {sec.multiplier > 0 ? (
                <text textAnchor="middle" dominantBaseline="middle"
                  fill={tf} fontSize="14" fontWeight="900"
                  fontFamily="Impact,Arial Narrow,sans-serif"
                  stroke="rgba(0,0,0,0.65)" strokeWidth="3" paintOrder="stroke"
                >x{sec.multiplier}</text>
              ) : (
                <>
                  <text textAnchor="middle" dominantBaseline="middle"
                    fill="#ff4444" fontSize="8" fontWeight="900"
                    fontFamily="Impact,Arial Narrow,sans-serif"
                    stroke="rgba(0,0,0,0.8)" strokeWidth="2" paintOrder="stroke"
                    y="-5">PIERDE</text>
                  <text textAnchor="middle" dominantBaseline="middle"
                    fill="#ff4444" fontSize="8" fontWeight="900"
                    fontFamily="Impact,Arial Narrow,sans-serif"
                    stroke="rgba(0,0,0,0.8)" strokeWidth="2" paintOrder="stroke"
                    y="5">TODO</text>
                </>
              )}
            </g>
          );
        })}

        {/* Hub central */}
        <circle cx={cx} cy={cy} r={hubR} fill="url(#wg-hub)" stroke="rgba(255,255,255,0.5)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={hubR - 8} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1" />
      </svg>
    );
  }, [sectionAngle]);

  /* ---- Starfield (generated once) ---- */
  const stars = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left:  Math.random() * 100,
    top:   Math.random() * 100,
    size:  Math.random() * 2.5 + 0.5,
    delay: Math.random() * 6,
    dur:   Math.random() * 3 + 2,
    op:    Math.random() * 0.5 + 0.2,
  })), []);

  /* ---- Burst particles ---- */
  const triggerBurst = useCallback((color) => {
    const count = 22;
    setBurstParticles(Array.from({ length: count }, (_, i) => ({
      id:    Date.now() + i,
      angle: (360 / count) * i + Math.random() * 8,
      dist:  55 + Math.random() * 70,
      size:  Math.random() * 9 + 4,
      color,
    })));
    setTimeout(() => setBurstParticles([]), 1100);
  }, []);

  /* ---- Sounds ---- */
  const playSpinSound = useSound('/sounds/spin.mp3');
  const playWinSound  = useSound('/sounds/win.mp3');
  const playLoseSound = useSound('/sounds/lose.mp3');
  const playBetSound  = useSound('/sounds/bet.mp3');

  /* ---- wrapText (kept, used by legacy drawWheel if needed) ---- */
  const wrapText = useCallback((ctx, text, x, y, maxWidth, lineHeight) => {
    const words = text.split(" ");
    let line  = "";
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

  /* ---- Draw wheel on canvas ---- */
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = radius, cy = radius;
    const sectionAngle = (2 * Math.PI) / sections.length;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sections.forEach((sec, i) => {
      const startAngle = i * sectionAngle;
      const endAngle   = startAngle + sectionAngle;
      const midAngle   = startAngle + sectionAngle / 2;
      const { r, g, b } = hexToRgb(sec.hex);

      const grad = ctx.createLinearGradient(
        cx + (radius * 0.25) * Math.cos(midAngle), cy + (radius * 0.25) * Math.sin(midAngle),
        cx + radius * Math.cos(midAngle),           cy + radius * Math.sin(midAngle)
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

      const tx = cx + radius * 0.66 * Math.cos(midAngle);
      const ty = cy + radius * 0.66 * Math.sin(midAngle);
      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midAngle + Math.PI / 2);
      const isWhite = sec.hex === "#ffffff";
      ctx.fillStyle    = isWhite ? "#111" : "#fff";
      ctx.shadowColor  = isWhite ? "rgba(0,0,0,0.6)" : `rgba(${r},${g},${b},0.9)`;
      ctx.shadowBlur   = 10;
      ctx.font         = "bold 16px Arial";
      ctx.textAlign    = "center";
      ctx.textBaseline = "middle";
      if (sec.multiplier > 0) {
        ctx.fillText(`x${sec.multiplier}`, 0, 0);
      } else {
        ctx.font = "bold 9px Arial";
        ctx.fillText("PIERDE", 0, -6);
        ctx.fillText("TODO",   0,  6);
      }
      ctx.restore();
    });

    // Glossy shine overlay
    const gloss = ctx.createRadialGradient(cx * 0.65, cy * 0.45, 0, cx, cy, radius);
    gloss.addColorStop(0,    "rgba(255,255,255,0.22)");
    gloss.addColorStop(0.45, "rgba(255,255,255,0.04)");
    gloss.addColorStop(1,    "rgba(0,0,0,0.18)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
    ctx.fillStyle = gloss;
    ctx.fill();

    // Metallic outer ring
    const ringGrad = ctx.createLinearGradient(0, 0, radius * 2, radius * 2);
    ringGrad.addColorStop(0,    "rgba(255,255,255,0.95)");
    ringGrad.addColorStop(0.35, "rgba(160,160,160,0.7)");
    ringGrad.addColorStop(0.65, "rgba(80,80,80,0.9)");
    ringGrad.addColorStop(1,    "rgba(220,220,220,0.8)");
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth   = 7;
    ctx.stroke();

    // Center hub
    const hubGrad = ctx.createRadialGradient(cx - 7, cy - 7, 1, cx, cy, 30);
    hubGrad.addColorStop(0,   "#ffffff");
    hubGrad.addColorStop(0.3, "#dddddd");
    hubGrad.addColorStop(0.7, "#999999");
    hubGrad.addColorStop(1,   "#666666");
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle   = hubGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth   = 2;
    ctx.stroke();
  }, [radius]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- Highlight winning section on canvas ---- */
  const highlightSection = useCallback((index) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = radius, cy = radius;
    const sectionAngle = (2 * Math.PI) / sections.length;
    const startAngle = index * sectionAngle;
    const endAngle   = startAngle + sectionAngle;
    const { r, g, b } = hexToRgb(sections[index].hex);
    const glowColor = `rgba(${r},${g},${b},0.9)`;

    // Pulsing glow arc on the winning slice
    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur  = 30;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius - 6, startAngle, endAngle);
    ctx.closePath();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth   = 5;
    ctx.stroke();

    // Bright outer arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 8, startAngle, endAngle);
    ctx.strokeStyle = glowColor;
    ctx.lineWidth   = 6;
    ctx.stroke();
    ctx.restore();
  }, [radius]);

  useEffect(() => { drawWheel(); }, [drawWheel]);

  useEffect(() => {
    return () => timersRef.current.forEach((t) => clearTimeout(t));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---- Light variants for roulette lights image ---- */
  const lightVariants = {
    idle: { opacity: 0.8, filter: 'brightness(0.7)' },
    on:   { opacity: 1,   filter: 'brightness(1.2)' },
    flicker: {
      opacity: [1, 0.7, 1],
      filter:  ['brightness(1.5)', 'brightness(1.0)', 'brightness(1.5)'],
      transition: { duration: 0.3, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }
    }
  };
  const lightTransition = { duration: 0.2, ease: "easeInOut" };

  /* ---- History helper ---- */
  const pushHistory = (landed, bets, totalWin, losses) => {
    const now   = new Date();
    const fecha = now.toLocaleDateString();
    const hora  = now.toLocaleTimeString();
    setHistory((h) => {
      const next = [{ landed, bets: {...bets}, totalWin, losses: {...losses}, fecha, hora }, ...h];
      return next.slice(0, MAX_HISTORY);
    });
  };

  /* ---- SPIN ---- */
  const spin = () => {
    const totalBet = bets.rojo + bets.azul + bets.blanco;
    if (spinning) return;
    if (totalBet <= 0)           { setToast({ text: "Debes apostar al menos en un color", type: 'info' }); return; }
    if (totalBet > playerBalance){ setToast({ text: "Saldo insuficiente", type: 'info' }); return; }

    setSpinning(true);
    setIsRoundActive(true);
    setResult(null);
    setLastWin(null);
    setPlayerBalance((p) => Number((p - totalBet).toFixed(8)));
    setLastBets(bets);
    setLightAnimationState('flicker');
    playSpinSound();
    drawWheel(); // Limpiar highlight del giro anterior

    const randomRotation = 360 * 7 + Math.floor(Math.random() * 360);
    const final = rotation + randomRotation;
    setRotation(final);

    const tEnd = setTimeout(() => {
      const normalized = (final % 360 + 360) % 360;
      const sectionSize = 360 / sections.length;
      // rotate(0deg) = nariz hacia adentro = apunta directamente a la sección bajo el cuerpo del avión
      // El avión en 12 en punto → canvas 270° → sección 10. Al rotar N° → canvas (270+N)%360
      const canvasAngle = (270 + normalized) % 360;
      const index       = Math.floor(canvasAngle / sectionSize) % sections.length;
      const landed      = sections[index];
      setResult(landed);

      // Resaltar la sección ganadora en el canvas
      drawWheel();
      setTimeout(() => highlightSection(index), 50);

      let totalWin = 0;
      let losses   = {};
      const landedColor = landed.name.toLowerCase();

      if      (landedColor === "rojo"   && bets.rojo   > 0) totalWin = bets.rojo   * landed.multiplier;
      else if (landedColor === "azul"   && bets.azul   > 0) totalWin = bets.azul   * landed.multiplier;
      else if (landedColor === "blanco" && bets.blanco > 0) totalWin = bets.blanco * landed.multiplier;

      if (landedColor !== "rojo")   losses.rojo   = bets.rojo;
      if (landedColor !== "azul")   losses.azul   = bets.azul;
      if (landedColor !== "blanco") losses.blanco = bets.blanco;
      if (landedColor === "negro")  { losses.rojo = bets.rojo; losses.azul = bets.azul; losses.blanco = bets.blanco; }

      if (landed.name === "NEGRO") {
        playLoseSound();
        triggerBurst("#333333");
        setScreenFlash({ color: "rgba(80,0,0,0.6)", key: Date.now() });
        setLastWin({ amount: 0, color: landed.hex, name: landed.name, won: false });
        setToast({ text: "Cayó NEGRO 😢 Pierdes todas las apuestas", type: 'lose' });
      } else if (totalWin > 0) {
        setPlayerBalance((p) => Number((p + totalWin).toFixed(8)));
        playWinSound();
        triggerBurst(landed.hex);
        setScreenFlash({ color: landed.hex === '#ffffff' ? 'rgba(200,200,200,0.4)' : `${landed.hex}55`, key: Date.now() });
        setLastWin({ amount: totalWin, color: landed.hex, name: landed.name, won: true });
        setToast({ text: `✅ Ganaste ${totalWin.toFixed(0)} fichas en ${landed.name}!`, type: 'win' });
        confetti({ particleCount: 130, spread: 75, origin: { y: 0.45 }, colors: [landed.hex, '#ffd700', '#ffffff'] });
      } else {
        playLoseSound();
        triggerBurst("#444");
        setScreenFlash({ color: "rgba(60,0,0,0.5)", key: Date.now() });
        setLastWin({ amount: 0, color: landed.hex, name: landed.name, won: false });
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

  /* ---- Bet helpers ---- */
  const addBet = (color) => {
    setBets((prev) => {
      const total = prev.rojo + prev.azul + prev.blanco + chipValue;
      if (total > MAX_BET) {
        setToast({ text: `Máximo ${MAX_BET} fichas en total`, type: 'info' });
        return prev;
      }
      playBetSound();
      return { ...prev, [color]: prev[color] + chipValue };
    });
  };

  const repeatBet = () => { if (!lastBets) return; setBets(lastBets); };

  const doubleBet = () => {
    setBets((prev) => {
      const doubled = { rojo: prev.rojo * 2, azul: prev.azul * 2, blanco: prev.blanco * 2 };
      if (doubled.rojo + doubled.azul + doubled.blanco > MAX_BET) {
        setToast({ text: "El doble supera el límite de apuesta", type: 'info' });
        return prev;
      }
      return doubled;
    });
  };

  const clearBets = () => { setBets({ rojo: 0, azul: 0, blanco: 0 }); };

  /* ---- Shop purchase ---- */
  const handleBuyPackage = async (pkg) => {
    // Paquete gratuito
    if (pkg.usd === 0) {
      setPlayerBalance((p) => p + pkg.amount);
      setShowShop(false);
      setToast({ text: `+${pkg.amount} fichas añadidas!`, type: 'win' });
      return;
    }

    if (inWorldApp) {
      try {
        // Obtener precio WLD en tiempo real para cobrar precio USD fijo
        let wldAmount = pkg.usd; // fallback: 1:1 si no hay precio
        try {
          const priceRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=worldcoin-wld&vs_currencies=usd');
          const priceData = await priceRes.json();
          const wldUsdPrice = priceData['worldcoin-wld']?.usd || 1;
          wldAmount = (pkg.usd / wldUsdPrice).toFixed(6);
        } catch (_) { /* usar fallback */ }

        const result = await MiniKit.pay({
          to: PAYMENT_ADDRESS,
          tokens: [{ symbol: "WLD", token_amount: String(wldAmount) }],
          description: `${pkg.label} — Avión de Colores (USD $${pkg.usd})`,
          reference: `fichas-${pkg.id}-${Date.now()}`,
        });
        if (result?.finalPayload?.status === 'success') {
          setPlayerBalance((p) => p + pkg.amount);
          setShowShop(false);
          setToast({ text: `+${pkg.amount} fichas añadidas!`, type: 'win' });
        } else {
          setToast({ text: "Pago cancelado.", type: 'lose' });
        }
      } catch (err) {
        setToast({ text: "Error en el pago. Inténtalo de nuevo.", type: 'lose' });
      }
    } else {
      // Demo mode — agrega fichas directo (sin pago real)
      setPlayerBalance((p) => p + pkg.amount);
      setShowShop(false);
      setToast({ text: `+${pkg.amount} fichas añadidas! (modo demo)`, type: 'win' });
    }
  };

  /* ============================================================
     RENDER
     ============================================================ */
  /* ---- Light variants ---- */
  const lightVariants2 = {
    idle:    { opacity: 0.75, filter: 'brightness(0.65)' },
    on:      { opacity: 1,    filter: 'brightness(1.25)' },
    flicker: { opacity: [1,0.6,1], filter: ['brightness(1.6)','brightness(0.9)','brightness(1.6)'],
               transition: { duration: 0.3, repeat: Infinity, repeatType:'loop' } },
  };

  return (
    <div
      className="game-root"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ---- Starfield ---- */}
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left: `${s.left}%`, top: `${s.top}%`,
            width: s.size, height: s.size,
            '--dur': `${s.dur}s`, '--delay': `${s.delay}s`, '--base-op': s.op,
          }}
        />
      ))}

      {/* ---- Screen flash ---- */}
      {screenFlash && (
        <div
          key={screenFlash.key}
          className="screen-flash"
          style={{ background: `radial-gradient(circle, ${screenFlash.color} 0%, transparent 70%)` }}
        />
      )}

      {/* ======================================================
          HUD BAR (always visible once verified)
         ====================================================== */}
      <motion.div
        className="hud-bar"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <img src="/assets/logo.png" alt="logo" style={{ height: 42, objectFit: "contain", filter: "drop-shadow(0 0 8px rgba(255,200,0,0.55))" }} />
        <div className="hud-balance-wrap">
          <span>💰</span>
          <motion.span
            key={Math.floor(playerBalance)}
            initial={{ scale: 1.4, color: "#fff500" }}
            animate={{ scale: 1,   color: "#ffe600" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {playerBalance.toFixed(0)}
          </motion.span>
          <span style={{ fontSize: 12, opacity: 0.7 }}> FICHAS</span>
        </div>
        <motion.button
          className="buy-btn"
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.05 }}
          onClick={() => setShowShop(true)}
        >
          + FICHAS
        </motion.button>
      </motion.div>

      {/* ======================================================
          BUNTING decorative flags
         ====================================================== */}
      <div className="bunting" style={{ marginTop: 0 }}>
        <div className="bunting-flags">
          {BUNTING_COLORS.map((c, i) => (
            <div key={i} className="bunting-flag" style={{ color: c }} />
          ))}
        </div>
      </div>

      {/* ======================================================
          NOT VERIFIED — welcome screen
         ====================================================== */}
      {!isVerified ? (
        <motion.div
          className="panel verify-panel"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{ zIndex: 2 }}
        >
          <div className="verify-title">¡Bienvenido! 👋</div>
          {inWorldApp ? (
            <>
              <p style={{ color: '#ccc', marginBottom: '20px', fontSize: 14 }}>
                Verifica tu identidad con World ID para jugar.
              </p>
              <motion.button
                className="verify-btn-primary"
                whileTap={{ scale: 0.95 }}
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
                    const res  = await fetch(`${API_URL}/api/verify`, {
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
              >
                Verificar con World ID
              </motion.button>
            </>
          ) : (
            <>
              <p style={{ color: '#ccc', marginBottom: '8px', fontSize: 14 }}>
                Para verificación completa, abre esta app dentro de{" "}
                <strong style={{ color: '#fff' }}>World App</strong>.
              </p>
              <p style={{ color: '#888', fontSize: 13, marginBottom: '20px' }}>
                O continúa como invitado para probar el juego.
              </p>
              <motion.button
                className="verify-btn-guest"
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVerified(true)}
              >
                Jugar como invitado
              </motion.button>
              <a
                href="https://worldcoin.org/mini-app?app_id=app_0421a6be5285baa95f9b59b01e75d91c"
                style={{ color: '#60a5fa', fontSize: 13, display: 'block', marginTop: 8 }}
              >
                Abrir en World App →
              </a>
            </>
          )}
        </motion.div>
      ) : (
        /* ======================================================
            MAIN GAME VIEW
           ====================================================== */
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            padding: "4px 12px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
            zIndex: 2,
          }}
        >

          {/* ---- WHEEL SECTION ---- */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
            style={{ perspective: "900px", marginTop: 8, width: "94%", maxWidth: 390, position: "relative" }}
          >
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

              {/* ── RUEDA SVG puro (100% compatible) ── */}
              <div style={{
                width: "100%", aspectRatio: "1", position: "relative",
                borderRadius: "50%",
                boxShadow: spinning
                  ? "0 0 0 6px #b8860b, 0 0 35px rgba(255,200,0,0.65), 0 0 65px rgba(255,100,0,0.35), 0 0 10px rgba(0,0,0,0.8)"
                  : "0 0 0 5px #7a5c0a, 0 0 18px rgba(0,0,0,0.7)",
                transition: "box-shadow 0.5s",
              }}>
                {WheelSVG}

                {/* Partículas burst */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
                  {burstParticles.map(p => (
                    <div key={p.id} className="burst-particle" style={{
                      width: p.size, height: p.size, background: p.color,
                      boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                      '--tx': `${Math.cos(p.angle * Math.PI / 180) * p.dist}px`,
                      '--ty': `${Math.sin(p.angle * Math.PI / 180) * p.dist}px`,
                    }} />
                  ))}
                </div>
              </div>

              {/* Luces decorativas (solo el overlay de luces, blend screen para que no tape) */}
              <motion.img
                src="/assets/roulette_lights_only.png"
                alt="Luces"
                variants={lightVariants}
                animate={lightAnimationState}
                transition={lightTransition}
                initial="idle"
                style={{
                  position: "absolute", top: -18, left: -20,
                  width: "110%", height: "110%",
                  mixBlendMode: "screen",
                  pointerEvents: "none", zIndex: 15,
                  opacity: 0.9,
                }}
              />

              {/* Orbital container — carries the plane */}
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: SPIN_DUR / 1000, ease: "easeOut" }}
                style={{
                  position: "absolute", top: 0, left: 0,
                  width: "100%", height: "100%",
                  pointerEvents: "none", zIndex: 20,
                }}
              >
                {spinning && (
                  <div
                    className="plane-trail"
                    style={{ position: "absolute", top: "5%", left: "calc(50% - 2px)", transformOrigin: "center bottom" }}
                  />
                )}
                <img
                  src="/assets/plane.png"
                  alt="avion"
                  style={{
                    position: "absolute", top: "-8%", left: "50%",
                    transform: "translateX(-50%) rotate(0deg)",
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
          </motion.div>

          {/* ---- RESULT BANNER ---- */}
          <AnimatePresence>
            {lastWin && (
              <motion.div
                key="result-banner"
                className="panel result-banner"
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                exit={{ scaleY: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{
                  marginTop: 10,
                  borderColor: lastWin.won ? "rgba(74,222,128,0.35)" : "rgba(248,113,113,0.35)",
                }}
              >
                <div
                  style={{
                    width: 14, height: 14, borderRadius: "50%",
                    background: lastWin.color,
                    boxShadow: `0 0 8px ${lastWin.color}`,
                    flexShrink: 0,
                  }}
                />
                {lastWin.won ? (
                  <span style={{ fontWeight: 900, fontSize: 15, color: "#4ade80" }}>
                    GANASTE{" "}
                    <motion.span
                      key={lastWin.amount}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      style={{ color: "#ffd700" }}
                    >
                      {lastWin.amount.toFixed(0)}
                    </motion.span>
                    {" "}FICHAS en {lastWin.name}
                  </span>
                ) : (
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#f87171" }}>
                    Sin premio — cayó {lastWin.name}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ---- CHIP SELECTOR ---- */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="chip-selector"
            style={{ marginTop: 14 }}
          >
            {[10, 50, 100].map((val, idx) => (
              <motion.button
                key={val}
                className={chipValue === val ? "active" : ""}
                onClick={() => setChipValue(val)}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.06 }}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0,  opacity: 1 }}
                transition={{ delay: 0.22 + idx * 0.06 }}
              >
                {val} pts
              </motion.button>
            ))}
          </motion.div>

          {/* ---- BET CHIPS ---- */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.28 }}
            style={{ display: "flex", gap: 14, marginTop: 14 }}
          >
            {[
              { key: "rojo",   label: "ROJO",   multi: "x1.5", cls: "chip-red",   val: bets.rojo   },
              { key: "azul",   label: "AZUL",   multi: "x2",   cls: "chip-blue",  val: bets.azul   },
              { key: "blanco", label: "BLANCO", multi: "x3",   cls: "chip-white", val: bets.blanco },
            ].map((chip, idx) => (
              <motion.button
                key={chip.key}
                className={`chip-btn ${chip.cls}`}
                onClick={() => addBet(chip.key)}
                whileTap={{ scale: 0.88, y: 4 }}
                whileHover={{ scale: 1.08 }}
                disabled={spinning}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1,   opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, delay: 0.3 + idx * 0.07 }}
              >
                <span>{chip.label}</span>
                <span style={{ fontSize: 12 }}>{chip.multi}</span>
                <span className="bet-badge">{chip.val > 0 ? `+${chip.val}` : "—"}</span>
              </motion.button>
            ))}
          </motion.div>

          {/* ---- CONTROL ROW ---- */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.38 }}
            style={{ display: "flex", gap: 8, marginTop: 12 }}
          >
            {[
              { label: "🔄 Repetir", action: repeatBet },
              { label: "✖2 Doblar", action: doubleBet },
              { label: "✕ Cero",    action: clearBets  },
            ].map((btn, idx) => (
              <motion.button
                key={btn.label}
                className="ctrl-btn"
                onClick={btn.action}
                disabled={spinning}
                whileTap={{ scale: 0.9 }}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0,  opacity: 1 }}
                transition={{ delay: 0.4 + idx * 0.06 }}
              >
                {btn.label}
              </motion.button>
            ))}
          </motion.div>

          {/* ---- HISTORY DOTS ROW ---- */}
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            style={{
              display: "flex", gap: 6, flexWrap: "wrap",
              justifyContent: "center", marginTop: 18,
            }}
          >
            {history.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 13, margin: 0 }}>
                Sin partidas aún
              </p>
            ) : (
              history.map((h, i) => (
                <motion.div
                  key={i}
                  className="hist-dot"
                  onClick={() => setShowHistory(true)}
                  title={`${h.landed.name} — ${h.totalWin > 0 ? `+${h.totalWin.toFixed(0)}` : "Perdiste"}`}
                  style={{ background: h.landed.hex, boxShadow: `0 0 8px ${h.landed.hex}` }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 280, delay: i * 0.04 }}
                  whileHover={{ scale: 1.3 }}
                />
              ))
            )}
            {history.length > 0 && (
              <motion.button
                onClick={() => setShowHistory(true)}
                whileTap={{ scale: 0.9 }}
                style={{
                  background: "none", border: "1px solid rgba(255,215,0,0.3)",
                  color: "#ffd700", borderRadius: 20, padding: "3px 12px",
                  fontSize: 12, cursor: "pointer",
                }}
              >
                Ver historial
              </motion.button>
            )}
          </motion.div>
        </div>
      )}

      {/* ======================================================
          TOAST NOTIFICATION
         ====================================================== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setToast(null)}
          >
            <motion.div
              className={`toast-card ${toast.type}`}
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1,   y: 0  }}
              exit={{ scale: 0.7,    y: 40 }}
              transition={{ type: "spring", stiffness: 280, damping: 22 }}
            >
              {toast.text}
              <div className="toast-hint">Toca para continuar</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ======================================================
          HISTORY DRAWER (slides from bottom)
         ====================================================== */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              className="history-drawer"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              <div className="drawer-handle" />
              <div className="drawer-header">
                <span className="gold-text" style={{ fontWeight: 900, fontSize: 17 }}>
                  📜 Historial
                </span>
                <motion.button
                  className="drawer-close-btn"
                  onClick={() => setShowHistory(false)}
                  whileTap={{ scale: 0.88 }}
                >
                  ✕
                </motion.button>
              </div>
              {history.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.4)", padding: "20px 18px", fontSize: 14 }}>
                  No hay partidas aún.
                </p>
              ) : (
                history.map((h, i) => {
                  const ganancia = h.totalWin;
                  const perdida  = Object.values(h.losses).reduce((a, b) => a + b, 0);
                  const won      = ganancia > 0;
                  return (
                    <motion.div
                      key={i}
                      className="history-row"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0,   opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <div className="hist-color-dot" style={{ background: h.landed.hex, boxShadow: `0 0 6px ${h.landed.hex}` }} />
                      <span className="hist-row-name">{h.landed.name}</span>
                      <span className={`hist-row-result ${won ? "win" : "lose"}`}>
                        {won
                          ? `+${ganancia.toFixed(0)} fichas`
                          : `−${perdida.toFixed(0)} fichas`}
                      </span>
                      <span className="hist-row-time">{h.hora}</span>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ======================================================
          COIN SHOP MODAL
         ====================================================== */}
      <AnimatePresence>
        {showShop && (
          <>
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowShop(false)}
            />
            <div className="shop-modal-wrap" style={{ zIndex: 85 }}>
              <motion.div
                className="shop-modal"
                initial={{ scale: 0.7, opacity: 0, y: 40 }}
                animate={{ scale: 1,   opacity: 1, y: 0  }}
                exit={{ scale: 0.75,   opacity: 0, y: 30 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
              >
                <motion.button
                  className="shop-close-btn"
                  onClick={() => setShowShop(false)}
                  whileTap={{ scale: 0.85 }}
                >
                  ✕
                </motion.button>

                <div className="shop-title gold-text">COMPRAR FICHAS</div>
                <div className="shop-subtitle">
                  Precio fijo en USD — pagado en WLD al tipo de cambio del momento
                </div>

                {SHOP_PACKAGES.map((pkg, idx) => (
                  <motion.div
                    key={pkg.id}
                    className="ficha-pkg"
                    onClick={() => handleBuyPackage(pkg)}
                    initial={{ x: -24, opacity: 0 }}
                    animate={{ x: 0,   opacity: 1 }}
                    transition={{ delay: 0.1 + idx * 0.08 }}
                    whileTap={{ scale: 0.96 }}
                    whileHover={{ scale: 1.02 }}
                    style={{ border: pkg.priceClass === 'hot' ? '1px solid #ffd700' : undefined }}
                  >
                    <span className="ficha-pkg-coin">🪙</span>
                    <div className="ficha-pkg-info">
                      <div className="ficha-pkg-amount">{pkg.label}</div>
                      <div className="ficha-pkg-label">{pkg.desc}</div>
                    </div>
                    <div className={`ficha-pkg-price ${pkg.usd === 0 ? 'free' : ''}`}>
                      {pkg.usd === 0 ? 'GRATIS' : `$${pkg.usd}`}
                    </div>
                  </motion.div>
                ))}

                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
                  {inWorldApp
                    ? "El pago en WLD equivale al precio USD del momento."
                    : "Abre en World App para pagar con WLD. En modo demo las fichas son gratuitas."}
                </p>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
