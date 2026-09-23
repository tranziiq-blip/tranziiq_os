import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Save, Building2, Upload } from "lucide-react";

export default function OrganizationTab() {
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.CompanyProfile.list();
        if (list.length > 0) setProfile(list[0]);
        else
          setProfile({
            company_name: "",
            registration_number: "",
            vat_number: "",
            address_line1: "",
            city: "",
            province: "",
            postal_code: "",
            phone: "",
            email: "",
            currency: "ZAR",
            timezone: "Africa/Johannesburg",
            logo_url: "",
          });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (field, value) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setProfile((prev) => ({ ...prev, logo_url: file_url }));
      toast({ title: "Logo uploaded — click Save to persist" });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!profile.company_name) {
      toast({ title: "Company name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (profile.id)
        await base44.entities.CompanyProfile.update(profile.id, profile);
      else {
        const created = await base44.entities.CompanyProfile.create(profile);
        setProfile(created);
      }
      toast({ title: "Company profile saved" });
    } catch (e) {
      toast({
        title: "Failed to save",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
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
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2  text-base font-semibold">
            <Building2 size={18} className="text-brand-blue" />
            Company Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo upload */}
          <div className="flex flex-wrap items-center gap-4 rounded-lg border  border-border p-4">
            {profile.logo_url ? (
              <Image
                src={profile.logo_url}
                className="h-20 w-20 rounded-lg border  border-border object-contain bg-white"
                fittingType="fit"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-lg  border-2 border-dashed border-border bg-muted/30">
                <Building2 size={28} className="text-muted-foreground/50" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-medium text-brand-navy">
                Company Logo
              </p>
              <p className="text-xs text-muted-foreground">
                Upload your company logo — appears on invoices, delivery notes,
                and the app sidebar.
              </p>
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  id="logo-upload"
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={uploadingLogo}
                  onClick={() => document.getElementById("logo-upload").click()}
                >
                  <Upload size={14} />{" "}
                  {uploadingLogo
                    ? "Uploading…"
                    : profile.logo_url
                      ? "Change Logo"
                      : "Upload Logo"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input
                value={profile.company_name || ""}
                onChange={(e) => handleChange("company_name", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Registration No.</Label>
              <Input
                value={profile.registration_number || ""}
                onChange={(e) =>
                  handleChange("registration_number", e.target.value)
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>VAT Number</Label>
              <Input
                value={profile.vat_number || ""}
                onChange={(e) => handleChange("vat_number", e.target.value)}
                placeholder="e.g. 4123456789"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={profile.email || ""}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={profile.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input
                value={profile.address_line1 || ""}
                onChange={(e) => handleChange("address_line1", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input
                value={profile.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Province</Label>
              <Input
                value={profile.province || ""}
                onChange={(e) => handleChange("province", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Postal Code</Label>
              <Input
                value={profile.postal_code || ""}
                onChange={(e) => handleChange("postal_code", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Input
                value={profile.currency || "ZAR"}
                onChange={(e) => handleChange("currency", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save size={16} /> {saving ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
