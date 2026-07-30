/**
 * Animated gradient text (React Bits GradientText pattern, own
 * implementation). Pure CSS (background-clip + pan keyframes in
 * globals.css), tenant-brand colored, static under prefers-reduced-motion.
 */
export function GradientText({ text, className }: { text: string; className?: string }) {
  return <span className={`gradient-text ${className ?? ""}`}>{text}</span>;
}
