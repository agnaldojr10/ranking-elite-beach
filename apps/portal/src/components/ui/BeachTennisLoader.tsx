'use client';

import { useEffect, useState } from 'react';

/** Frases que "passam" enquanto carrega (disfarçam o cold start do servidor). */
const PHRASES = [
  'Preparando as quadras…',
  'Inflando as bolinhas…',
  'Passando o protetor solar…',
  'Chamando as duplas…',
  'Acordando o servidor…',
];

const OCEAN = '#2dd4bf';
const GOLD = '#f5c95a';
const CORAL = '#ff8a6a';

/**
 * Tela de carregamento temática de Beach Tennis. Fase 1 (0–5s): mensagem +
 * frases passando. Fase 2 (>5s): bonecos-palito jogando + bolinha ralando +
 * wordmark com a bolinha no lugar do pingo do "i". Fica em loop até carregar.
 */
export function BeachTennisLoader() {
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setPlaying(true), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setIdx((n) => (n + 1) % PHRASES.length), 1800);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="btl-wrap" role="status" aria-live="polite">
      <span className="btl-sr">Carregando o aplicativo…</span>

      {/* Cena com os bonecos-palito (entra na fase 2) */}
      <div className={`btl-scene ${playing ? 'is-on' : ''}`} aria-hidden>
        <Stick side="left" />
        <div className="btl-net" />
        <div className="btl-ball-x">
          <div className="btl-ball-y">
            <span className="btl-ball" />
          </div>
        </div>
        <Stick side="right" />
        <div className="btl-sand" />
      </div>

      {/* Wordmark: Beach Tenn[•]s — o pingo do i é a bolinha */}
      <div className="btl-mark" aria-hidden>
        <span className="btl-beach">Beach</span>
        <span className="btl-tennis">
          Tenn<span className="btl-i">ı<span className="btl-idot" /></span>s
        </span>
      </div>

      <p className="btl-title">Seu aplicativo está carregando</p>
      <p className="btl-phrase" key={idx}>
        {PHRASES[idx]}
      </p>

      <style jsx>{`
        .btl-wrap {
          display: grid;
          place-items: center;
          min-height: 100dvh;
          padding: 24px;
          text-align: center;
          gap: 6px;
        }
        .btl-sr {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        /* ---- Cena dos bonecos ---- */
        .btl-scene {
          position: relative;
          width: 280px;
          height: 130px;
          margin-bottom: 4px;
          opacity: 0;
          transform: translateY(8px) scale(0.96);
          transition: opacity 0.5s ease, transform 0.5s ease;
        }
        .btl-scene.is-on {
          opacity: 1;
          transform: none;
        }
        .btl-sand {
          position: absolute;
          left: 6%;
          right: 6%;
          bottom: 14px;
          height: 3px;
          border-radius: 3px;
          background: linear-gradient(90deg, transparent, ${GOLD}, transparent);
          opacity: 0.7;
        }
        .btl-net {
          position: absolute;
          left: 50%;
          bottom: 16px;
          width: 2px;
          height: 34px;
          transform: translateX(-50%);
          background: rgb(var(--c-line, 30 54 62));
          border-top: 3px solid ${OCEAN};
        }

        /* Bolinha ralando: X vai e volta, Y faz o arco */
        .btl-ball-x {
          position: absolute;
          bottom: 40px;
          left: 40px;
          animation: btl-rally 1.15s ease-in-out infinite alternate;
        }
        .btl-ball-y {
          animation: btl-arc 0.575s ease-in-out infinite alternate;
        }
        .btl-ball {
          display: block;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: radial-gradient(circle at 32% 30%, #fff6, ${GOLD} 45%, #d9a520);
          box-shadow: 0 0 10px ${GOLD}88;
        }
        @keyframes btl-rally {
          from { transform: translateX(0); }
          to { transform: translateX(190px); }
        }
        @keyframes btl-arc {
          from { transform: translateY(0); }
          to { transform: translateY(-48px); }
        }

        /* ---- Wordmark ---- */
        .btl-mark {
          display: flex;
          align-items: baseline;
          gap: 8px;
          font-weight: 800;
          letter-spacing: 0.5px;
          line-height: 1;
          margin-top: 2px;
        }
        .btl-beach {
          font-size: 20px;
          color: ${CORAL};
        }
        .btl-tennis {
          font-size: 28px;
          color: ${OCEAN};
          position: relative;
        }
        .btl-i {
          position: relative;
        }
        .btl-idot {
          position: absolute;
          left: 50%;
          top: -6px;
          width: 8px;
          height: 8px;
          margin-left: -4px;
          border-radius: 999px;
          background: radial-gradient(circle at 32% 30%, #fff6, ${GOLD} 45%, #d9a520);
          box-shadow: 0 0 8px ${GOLD}aa;
          animation: btl-idot 0.9s ease-in-out infinite;
        }
        @keyframes btl-idot {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.12); }
        }

        /* ---- Textos ---- */
        .btl-title {
          margin-top: 10px;
          font-size: 15px;
          font-weight: 700;
          color: rgb(var(--c-ink, 236 247 245));
        }
        .btl-phrase {
          font-size: 13px;
          color: rgb(var(--c-muted, 112 142 150));
          animation: btl-phrase 0.5s ease;
          min-height: 1.2em;
        }
        @keyframes btl-phrase {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .btl-ball-x, .btl-ball-y, .btl-idot { animation: none; }
        }
      `}</style>
    </div>
  );
}

/** Boneco-palito com o braço da raquete balançando. */
function Stick({ side }: { side: 'left' | 'right' }) {
  const flip = side === 'right';
  return (
    <svg
      className={`btl-stick btl-${side}`}
      width="56"
      height="80"
      viewBox="0 0 40 56"
      fill="none"
      style={{
        position: 'absolute',
        bottom: 12,
        [side]: 6,
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    >
      <g stroke="#2dd4bf" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="8" r="5" />
        <path d="M18 13 L18 32" />
        <path d="M18 32 L12 48 M18 32 L24 48" />
        <path d="M18 18 L9 24" />
        {/* braço da raquete + raquete (balança) */}
        <g className="btl-arm" style={{ transformBox: 'view-box', transformOrigin: '18px 18px' }}>
          <path d="M18 18 L30 12" />
          <ellipse cx="33" cy="10" rx="4.5" ry="6" transform="rotate(28 33 10)" stroke="#f5c95a" />
        </g>
      </g>
      <style jsx>{`
        .btl-arm {
          animation: btl-swing 1.15s ease-in-out infinite alternate;
        }
        .btl-right .btl-arm {
          animation-delay: 0.575s;
        }
        @keyframes btl-swing {
          from { transform: rotate(-18deg); }
          to { transform: rotate(24deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .btl-arm { animation: none; }
        }
      `}</style>
    </svg>
  );
}
