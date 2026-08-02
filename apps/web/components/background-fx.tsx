/** Fixed ambient background: drifting neon grid, slow hue-cycling glow, and a scanline sweep. Purely decorative — no interactivity, so it stays a server component. */
export function BackgroundFx() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-20 overflow-hidden">
      <div className="arcana-bg-layer absolute inset-0" />
      <div className="arcana-scanline absolute inset-x-0 h-24" />
    </div>
  );
}
