import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from 
"@/components/ui/tabs";
import OrganizationTab from "@/components/admin/OrganizationTab";
import UsersTab from "@/components/admin/UsersTab";
import BillingTab from "@/components/admin/BillingTab";
import BusinessDirectory from "@/pages/BusinessDirectory";
import { Building2, Users, CreditCard, Settings, BookOpen } from 
"lucide-react";

export default function Admin() {
 const [tab, setTab] = useState("organization");

 return (
 <div className="space-y-6 animate-fade-in">
 <div>
 <h1 className="font-display text-2xl font-bold tracking-tight  text-brand-navy">Admin Settings</h1>
 <p className="text-sm text-muted-foreground">Organization profile · user 
management · billing configuration</p>
 </div>

 <Tabs value={tab} onValueChange={setTab}>
 <TabsList className="grid w-full grid-cols-4 max-w-2xl">
 <TabsTrigger value="organization" className="gap-1.5"><Building2 size={15} /> 
Organization</TabsTrigger>
 <TabsTrigger value="users" className="gap-1.5"><Users size={15} /> 
Users</TabsTrigger>
 <TabsTrigger value="directory" className="gap-1.5"><BookOpen size={15} /> 
Directory</TabsTrigger>
 <TabsTrigger value="billing" className="gap-1.5"><CreditCard size={15} /> 
Billing</TabsTrigger>
 </TabsList>
 <TabsContent value="organization" className="mt-4"><OrganizationTab 
/></TabsContent>
 <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
 <TabsContent value="directory" className="mt-4"><BusinessDirectory 
/></TabsContent>
 <TabsContent value="billing" className="mt-4"><BillingTab /></TabsContent>
 </Tabs>
 </div>
 );
}
