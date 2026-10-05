export function CampoFundo() {
  return (
    <div className="fut-fundo" aria-hidden>
      <div className="fut-luz" />
      <svg className="fut-campo" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <rect x="80" y="40" width="1040" height="720" fill="none" stroke="currentColor" strokeWidth="3" />
        <line x1="600" y1="40" x2="600" y2="760" stroke="currentColor" strokeWidth="3" />
        <circle cx="600" cy="400" r="118" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="600" cy="400" r="5" fill="currentColor" />
        <rect x="80" y="220" width="180" height="360" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="940" y="220" width="180" height="360" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="80" y="310" width="78" height="180" fill="none" stroke="currentColor" strokeWidth="3" />
        <rect x="1042" y="310" width="78" height="180" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M260 338 a70 70 0 0 1 0 124" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M940 338 a70 70 0 0 0 0 124" fill="none" stroke="currentColor" strokeWidth="3" />
      </svg>
    </div>
  )
}
