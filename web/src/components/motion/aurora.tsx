/**
 * Aurora background (React Bits Aurora pattern, own implementation).
 * Three brand-tinted blobs drifting on pure CSS keyframes — GPU-only
 * (transform/opacity), no JS, no layout work; freezes under
 * prefers-reduced-motion via the .aurora-blob media query in globals.css.
 * Colors derive from the tenant's --brand vars, per the taste rules.
 */
export function Aurora() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="aurora-blob left-[-10%] top-[-25%] h-[30rem] w-[30rem]"
        style={{ background: "color-mix(in srgb, var(--brand) 50%, white)" }}
      />
      <div
        className="aurora-blob right-[-15%] top-[5%] h-[26rem] w-[26rem]"
        style={{ background: "color-mix(in srgb, var(--brand-accent) 55%, white)", animationDelay: "-6s" }}
      />
      <div
        className="aurora-blob bottom-[-35%] left-[25%] h-[28rem] w-[28rem]"
        style={{ background: "color-mix(in srgb, var(--brand) 30%, white)", animationDelay: "-12s" }}
      />
    </div>
  );
}
