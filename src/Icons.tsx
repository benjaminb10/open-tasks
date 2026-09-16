type P = { className?: string; style?: React.CSSProperties }

export const Circle = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

export const CheckCircle = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="12" cy="12" r="9" fill="currentColor" />
    <path
      d="M8 12.3l2.6 2.6L16 9.5"
      stroke="var(--color-panel)"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Star = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M12 3.5l2.5 5.3 5.8.7-4.3 3.9 1.2 5.7L12 22l-5.2-2.9 1.2-5.7L3.7 9.5l5.8-.7z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
)

export const StarOutline = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M12 3.5l2.5 5.3 5.8.7-4.3 3.9 1.2 5.7L12 22l-5.2-2.9 1.2-5.7L3.7 9.5l5.8-.7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)

export const Search = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
    <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
)

export const Plus = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M12 5v14M5 12h14"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
    />
  </svg>
)

export const Layers = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </svg>
)

export const Board = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <rect x="3" y="4" width="5.5" height="16" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
    <rect x="9.5" y="4" width="5.5" height="11" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
    <rect x="16" y="4" width="5" height="14" rx="1.4" stroke="currentColor" strokeWidth="1.6" />
  </svg>
)

export const List = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

export const Trash = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M4 7h16M9 7V5.5A1.5 1.5 0 0110.5 4h3A1.5 1.5 0 0115 5.5V7m2 0l-.7 12.1A1.5 1.5 0 0114.8 20.5H9.2a1.5 1.5 0 01-1.5-1.4L7 7"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Menu = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M4 7h16M4 12h16M4 17h16"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
)

export const More = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <circle cx="5" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="19" cy="12" r="1.6" fill="currentColor" />
  </svg>
)

export const Download = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M12 3.5v11m0 0l-4-4m4 4l4-4M4.5 16.5v2A1.5 1.5 0 006 20h12a1.5 1.5 0 001.5-1.5v-2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const Chevron = ({ className, style }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
    <path
      d="M9 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
