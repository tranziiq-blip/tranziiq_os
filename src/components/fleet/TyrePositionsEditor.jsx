import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus, CircleDot } from "lucide-react";

export default function TyrePositionsEditor({ value, onChange, generateNames 
}) {
 const positions = value || [];
 const count = positions.length;

 const setCount = (n) => {
 const next = Math.max(0, Math.min(40, Number(n) || 0));
 if (next === count) return;
 if (next < count) {
 onChange(positions.slice(0, next));
 } else {
 const names = generateNames(next);
 onChange(names.map((nm, i) => positions[i] || nm));
 }
 };

 const renamePosition = (i, name) => {
 const next = [...positions];
 next[i] = name;
 onChange(next);
 };

 return (
 <div className="rounded-lg border border-border/60 p-3">
 <div className="mb-2 flex items-center justify-between">
 <p className="flex items-center gap-1.5 text-xs font-semibold uppercase  tracking-wider text-muted-foreground">
 <CircleDot size={14} className="text-brand-teal" /> Tyre Positions ({count})
 </p>
 <div className="flex items-center gap-1.5">
 <Button type="button" size="icon" variant="outline" className="h-7 w-7" 
onClick={() => setCount(count - 1)} disabled={count <= 0}><Minus size={14} 
/></Button>
 <Input type="number" value={count} onChange={(e) => setCount(e.target.value)} 
className="h-7 w-14 text-center text-xs" min={0} max={40} />
 <Button type="button" size="icon" variant="outline" className="h-7 w-7" 
onClick={() => setCount(count + 1)}><Plus size={14} /></Button>
 </div>
 </div>
 {count === 0 ? (
 <p className="text-xs text-muted-foreground">No tyre positions set — add 
positions to enable per-position tyre inspections.</p>
 ) : (
 <div className="grid max-h-44 gap-1.5 overflow-y-auto sm:grid-cols-2">
 {positions.map((p, i) => (
 <div key={i} className="flex items-center gap-1.5">
 <span className="w-6 shrink-0 text-right text-[10px] font-bold  text-muted-foreground">{i + 1}</span>
 <Input value={p} onChange={(e) => renamePosition(i, e.target.value)} 
className="h-8 text-xs" placeholder={`Position ${i + 1}`} />
 </div>
 ))}
 </div>
 )}
 </div>
 );
}


hr 
