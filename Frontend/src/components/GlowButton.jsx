export default function GlowButton({ children, onClick, type = 'button', variant = 'primary', disabled }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`glow-btn ${variant === 'ghost' ? 'glow-btn--ghost' : ''}`}
    >
      {children}
    </button>
  );
}
