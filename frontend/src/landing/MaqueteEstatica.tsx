/** Elevação conceitual quando o WebGL não entra. Não representa uma obra. */
export default function MaqueteEstatica({ modo = 'hero' }: { modo?: 'hero' | 'narrativa' }) {
  return (
    <svg
      className={`lp-estatica ${modo === 'narrativa' ? 'is-nar' : 'is-hero'}`}
      viewBox="0 0 720 460"
      role="img"
      aria-label="Elevação conceitual de uma construção"
    >
      <g data-fase="0" fill="none" stroke="#111" strokeWidth="1.15">
        <path d="M48 390 H672" />
        <path d="M80 390 V78 H250 V168 H610 V390" />
        <path d="M80 78 L165 40 H250" />
        <path d="M118 390 V120 M188 390 V96" />
        <path d="M250 168 H610" stroke="#e36a1e" />
      </g>
      <g data-fase="1" fill="none" stroke="#111" strokeWidth="1">
        <path d="M96 390 H250 V300 H96 Z" />
        <path d="M620 390 H300 V250 H620 Z" />
      </g>
      <g data-fase="2" fill="none" stroke="#1c1c1c" strokeWidth="1">
        <path d="M318 250 V390 M400 250 V390 M500 250 V390 M580 250 V390" />
        <path d="M300 268 H620 M300 300 H620" />
      </g>
      <g data-fase="3" fill="none" stroke="#8A8A8A" strokeWidth="1">
        <path d="M330 278 H390 V360 H330 Z M420 278 H490 V360 H420 Z M530 278 H600 V360 H530 Z" />
        <path d="M112 150 H150 V230 H112 Z" stroke="#e36a1e" />
      </g>
      <g data-fase="4" fill="none" stroke="#111" strokeWidth="1.2">
        <path d="M70 168 H640" />
        <path d="M48 70 H200 M48 70 V96 M48 83 H68" stroke="#e36a1e" />
        <path d="M640 200 V390 M640 200 H668 M654 200 V220" stroke="#e36a1e" />
      </g>
    </svg>
  )
}
