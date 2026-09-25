import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Shield, User, Lock, Check } from "lucide-react";
import { MODULES } from "@/lib/moduleAccess";

export default function UsersTab() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDetails, setInviteDetails] = useState({ full_name: "", phone: "", job_title: "", department: "" });
  const setDetail = (k, v) => setInviteDetails((d) => ({ ...d, [k]: v }));
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteAccess, setInviteAccess] = useState([]);
  const [inviting, setInviting] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editAccess, setEditAccess] = useState([]);
  const [directoryClients, setDirectoryClients] = useState([]);
  const [inviteClientId, setInviteClientId] = useState("");
  const [invites, setInvites] = useState([]);
  const loadInvites = () =>
    base44.users.listInvites().then(setInvites).catch(() => setInvites([]));
  useEffect(() => {
    loadInvites();
  }, []);
  const cancelInvite = async (id) => {
    try {
      await base44.users.cancelInvite(id);
      loadInvites();
    } catch (e) {
      toast({ title: "Could not cancel", description: e.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setUsers(await base44.entities.User.list());
        setDirectoryClients(
          await base44.entities.BusinessDirectory.filter({
            entity_type: "client",
          }).catch(() => []),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const refresh = async () => {
    loadInvites();
    setUsers(await base44.entities.User.list());
    setDirectoryClients(
      await base44.entities.BusinessDirectory.filter({
        entity_type: "client",
      }).catch(() => []),
    );
  };

  const toggleInviteAccess = (key) => {
    setInviteAccess((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleEditAccess = (key) => {
    setEditAccess((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email || !inviteDetails.full_name.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    if (inviteRole === "client" && !inviteClientId) {
      toast({ title: "Select a client to link", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      const client =
        inviteRole === "client"
          ? directoryClients.find((c) => c.id === inviteClientId)
          : null;
      // Staff get their HR record (and driver record) created up front,
      // so everything is ready when they first sign in.
      let employeeId = null;
      let driverId = null;
      if (inviteRole === "user" || inviteRole === "admin") {
        const isDriver = inviteAccess.includes("driver_mobile");
        if (isDriver) {
          const drv = await base44.entities.Driver.create({
            full_name: inviteDetails.full_name.trim(),
            phone: inviteDetails.phone || null,
            status: "active",
          });
          driverId = drv.id;
        }
        const emp = await base44.entities.Employee.create({
          full_name: inviteDetails.full_name.trim(),
          email,
          phone: inviteDetails.phone || null,
          job_title: inviteDetails.job_title || (isDriver ? "Driver" : null),
          department: inviteDetails.department || null,
          status: "active",
          start_date: new Date().toISOString().slice(0, 10),
          driver_id: driverId,
        });
        employeeId = emp.id;
      }
      let emailed = false;
      let emailError = "";
      try {
        const res = await base44.users.inviteUser(email, inviteRole, {
          ...inviteDetails,
          full_name: inviteDetails.full_name.trim(),
          module_access: inviteAccess,
          linked_client_name: client?.name,
          linked_directory_id: client?.id,
          linked_employee_id: employeeId,
          linked_driver_id: driverId,
        });
        emailed = res.email_sent;
      } catch (e) {
        emailError = e.message;
        if (/already has an account/.test(e.message)) throw e;
      }
      if (client) {
        await base44.entities.BusinessDirectory.update(client.id, {
          portal_access_email: email,
          portal_access_enabled: true,
        }).catch(() => {});
      }
      toast(
        emailed
          ? {
              title: "Invitation sent",
              description: `${inviteDetails.full_name.trim()} will get an email at ${email} with a link to create their password.`,
            }
          : {
              title: "Invitation saved, email not sent",
              description: `${emailError || "The email could not be sent."} You can resend it from the pending list.`,
              variant: "destructive",
            },
      );
      setInviteEmail("");
      setInviteDetails({ full_name: "", phone: "", job_title: "", department: "" });
      setInviteAccess([]);
      setInviteClientId("");
      await refresh();
    } catch (e) {
      toast({ title: "Failed to invite", description: e.message, variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const resend = async (email) => {
    try {
      await base44.users.resendInvite(email);
      toast({ title: "Invitation re-sent", description: `A new link was emailed to ${email}.` });
      loadInvites();
    } catch (e) {
      toast({ title: "Could not resend", description: e.message, variant: "destructive" });
    }
  };

  const openEditAccess = (u) => {
    setEditUser(u);
    setEditAccess(u.module_access || []);
  };

  const saveEditAccess = async () => {
    try {
      await base44.entities.User.update(editUser.id, {
        module_access: editAccess,
      });
      toast({
        title: "Access updated",
        description: `${
          editUser.full_name || editUser.email
        }'s permissions saved`,
      });
      setEditUser(null);
      await refresh();
    } catch (e) {
      toast({
        title: "Failed to update",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-muted border-t-brand-teal rounded-full  animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Invite user */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2  text-base font-semibold">
            <UserPlus size={18} className="text-brand-teal" />
            Invite Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={inviteDetails.full_name} onChange={(e) => setDetail("full_name", e.target.value)} placeholder="e.g. Pako Raphoto" />
            </div>
            <div className="space-y-1.5">
              <Label>Cellphone</Label>
              <Input type="tel" value={inviteDetails.phone} onChange={(e) => setDetail("phone", e.target.value)} placeholder="e.g. 082 123 4567" />
            </div>
            {(inviteRole === "user" || inviteRole === "admin") && (
              <>
                <div className="space-y-1.5">
                  <Label>Job title</Label>
                  <Input value={inviteDetails.job_title} onChange={(e) => setDetail("job_title", e.target.value)} placeholder="e.g. Dispatcher, Driver, Finance Officer" />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input value={inviteDetails.department} onChange={(e) => setDetail("department", e.target.value)} placeholder="e.g. Transport, Finance" />
                </div>
              </>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label>Email address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.co.za"
              />
            </div>
            <div className="w-full sm:w-40 space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User (Internal)</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="client">Client (Portal Access)</SelectItem>
                  <SelectItem value="clearing_agent">
                    Clearing Agent (Portal Access)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleInvite}
              disabled={inviting}
              className="gap-2"
            >
              <UserPlus size={16} /> {inviting ? "Sending…" : "Send invitation"}
            </Button>
          </div>

          {inviteRole === "client" && (
            <div className="mt-4 rounded-lg border border-brand-teal/30 bg-brand-teal/5  p-3 space-y-2">
              <p className="text-xs font-medium text-brand-navy">
                Link to Client
              </p>
              <p className="text-xs text-muted-foreground">
                Select the client this portal user will represent. They will
                only see loads and invoices for this client.
              </p>
              <Select value={inviteClientId} onValueChange={setInviteClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {directoryClients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {inviteRole === "user" && (
            <div className="mt-4 rounded-lg border border-border p-3">
              <div className="flex items-center gap-2 mb-3">
                <Lock size={14} className="text-muted-foreground" />
                <p className="text-xs font-medium  text-muted-foreground">
                  Module access: tick what this person can use. Tick Driver Mobile for drivers.
                  Finance and Admin must be ticked to be given.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MODULES.map((m) => (
                  <label
                    key={m.key}
                    className="flex items-center gap-2 rounded-md border  border-border/50 px-2.5 py-1.5 text-xs cursor-pointer hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={inviteAccess.includes(m.key)}
                      onChange={() => toggleInviteAccess(m.key)}
                      className="h-3.5 w-3.5 rounded border-input"
                    />
                    <span className="font-medium">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {invites.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Pending Invitations ({invites.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              These invitations are saved but the email hasn't gone out yet. Tap Send email to try again.
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {invites.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{inv.email}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {String(inv.role).replace("_", " ")} · invited{" "}
                    {new Date(inv.created_at).toLocaleDateString("en-ZA")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => resend(inv.email)}>
                    Send email
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => cancelInvite(inv.id)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* User list */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base  font-semibold">
            Team Members ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                  Role
                </th>
                <th className="px-4 py-3 text-left font-medium  text-muted-foreground">
                  Access
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-border/50 last:border-0  hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium text-brand-navy">
                    {u.full_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u.email}
                    {u.invite_status === "invited" && (
                      <span className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          Invited · not activated
                        </span>
                        <button onClick={() => resend(u.email)} className="text-[11px] font-medium text-brand-blue hover:underline">
                          Resend email
                        </button>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "admin" ? (
                      <Badge className="bg-brand-navy text-white gap-1">
                        <Shield size={12} />
                        Admin
                      </Badge>
                    ) : u.role === "client" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 gap-1">
                        <User size={12} />
                        Client
                      </Badge>
                    ) : u.role === "clearing_agent" ? (
                      <Badge className="bg-amber-100 text-amber-700 gap-1">
                        <User size={12} />
                        Clearing Agent
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <User size={12} /> User
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "client" ? (
                      <span className="text-xs text-muted-foreground">
                        {u.linked_client_name || "Not  linked"}
                      </span>
                    ) : u.role === "clearing_agent" ? (
                      <span className="text-xs text-muted-foreground">
                        Freight Clearance Portal
                      </span>
                    ) : u.role === "admin" ? (
                      <span className="text-xs text-muted-foreground">
                        Full access
                      </span>
                    ) : !u.module_access || u.module_access.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Full access
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.module_access.slice(0, 3).map((k) => (
                          <Badge
                            key={k}
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {MODULES.find((m) => m.key === k)?.label || k}
                          </Badge>
                        ))}
                        {u.module_access.length > 3 && (
                          <Badge variant="secondary" className="text-[10px]">
                            +{u.module_access.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== "admin" && (
                      <button
                        onClick={() => openEditAccess(u)}
                        className="rounded-md p-1.5 text-brand-blue  hover:bg-brand-blue/10"
                      >
                        <Lock size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Edit access dialog */}
      <Dialog open={!!editUser} onOpenChange={(v) => !v && setEditUser(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock size={18} /> Module Access —{" "}
              {editUser?.full_name || editUser?.email}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Select which modules this user can access. Unchecked = hidden from
            sidebar & route blocked. Leave all unchecked for full access.
          </p>
          <div className="grid grid-cols-2 gap-2 py-2 sm:grid-cols-3">
            {MODULES.map((m) => (
              <label
                key={m.key}
                className={`flex items-center gap-2 rounded-md border 
px-2.5 py-2 text-xs cursor-pointer ${
                  editAccess.includes(m.key)
                    ? "border-brand-teal bg-brand-teal/5"
                    : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={editAccess.includes(m.key)}
                  onChange={() => toggleEditAccess(m.key)}
                  className="h-3.5 w-3.5 rounded border-input"
                />
                <span className="font-medium">{m.label}</span>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveEditAccess}
              className="gap-2 bg-brand-navy  hover:bg-brand-navy/90"
            >
              <Check size={16} /> Save Access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
