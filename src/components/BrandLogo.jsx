export default function BrandLogo({ size = 40, withText = false, light = false 
}) {
 return (
 <div className="flex items-center gap-3">
 <svg width={size} height={size} viewBox="0 0 48 48" fill="none" 
xmlns="http://www.w3.org/2000/svg" className="shrink-0">
 {/* T structure - dark navy */}
 <rect x="6" y="8" width="22" height="5" rx="1.5" fill="#002D5B" />
 <path d="M15 13 L15 40 L20 40 L20 16.5 L20 40 L25 40 L25 13 Z" fill="#002D5B" 
/>
 <path d="M20 16.5 L25 13 L25 40 L20 40 Z" fill="#01223f" />
 {/* Q curve - vibrant blue */}
 <path d="M30 8 a14 14 0 1 1 -0.1 28" stroke="#007BFF" strokeWidth="5" 
strokeLinecap="round" fill="none" />
 {/* Q tail - teal */}
 <path d="M34 34 L44 44" stroke="#00BFA5" strokeWidth="5" 
strokeLinecap="round" />
 </svg>
 {withText && (
 <div className="leading-none">
 <div className={`font-display font-bold tracking-[0.18em] text-lg ${light ? 
"text-white" : "text-brand-navy"}`}>
 TRANZ<span className="text-brand-teal">II</span>Q
 </div>
 <div className={`text-[10px] tracking-[0.3em] font-medium ${light ? 
"text-white/60" : "text-muted-foreground"}`}>OS</div>
 </div>
 )}
 </div>
 );
}
