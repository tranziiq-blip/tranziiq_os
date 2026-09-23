export default function BrandLogo({
  size = 40,
  withText = false,
  light = false,
}) {
  return (
    <div className="flex items-center gap-3">
      <img
        src="/brand/tranziiq-mark.png"
        alt={withText ? "" : "TranziIQ"}
        style={{ height: size, width: "auto" }}
        className="shrink-0"
      />
      {withText && (
        <div className="leading-none">
          <div
            className={`font-display font-bold tracking-[0.18em] text-lg ${
              light ? "text-white" : "text-brand-navy"
            }`}
          >
            TRANZ<span className="text-brand-teal">II</span>Q
          </div>
          <div
            className={`text-[10px] tracking-[0.3em] font-medium ${
              light ? "text-white/60" : "text-muted-foreground"
            }`}
          >
            OS
          </div>
        </div>
      )}
    </div>
  );
}
