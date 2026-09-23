import { expiryStatus } from "@/lib/fleetTypes";

export default function ExpiryBadge({ date }) {
 const status = expiryStatus(date);
 const dateText = date ? new Date(date).toLocaleDateString("en-ZA", { day: 
"2-digit", month: "short", year: "numeric" }) : "Not set";
 return (
 <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 
text-[10px] font-medium ${status.color}`}>
 {dateText}
 </span>
 );
}
