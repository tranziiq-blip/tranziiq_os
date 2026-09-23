import { Check, X, Minus } from "lucide-react";

export default function CheckItem({ item, value, onChange }) {
 const btn = (active, color, Icon, val) => (
 <button
 onClick={() => onChange(item.id, val)}
 className={`flex h-8 w-8 items-center justify-center rounded-md border 
transition ${active ? color : "border-border bg-card text-muted-foreground  hover:bg-muted"}`}
 >
 <Icon size={14} />
 </button>
 );

 return (
 <div className="flex items-center justify-between gap-3 border-b  border-border/40 py-2 last:border-0">
 <span className="flex-1 text-sm">{item.label}</span>
 <div className="flex gap-1.5">
 {btn(value === "pass", "border-emerald-300 bg-emerald-50 text-emerald-600", 
Check, "pass")}
 {btn(value === "fail", "border-rose-300 bg-rose-50 text-rose-600", X, "fail")}
 {btn(value === "na", "border-slate-300 bg-slate-50 text-slate-500", Minus, 
"na")}
 </div>
 </div>
 );
}
