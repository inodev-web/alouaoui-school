import React, { useState, useEffect } from "react";
import AuthService from "../../services/api/auth.service";
import branchesService from "../../services/api/branches.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Page paramètres profil étudiant (limite: une modification complète par jour)
export default function StudentSettingsPage() {
  const [user, setUser] = useState(AuthService.getCurrentUser());
  const [form, setForm] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    birth_date: "",
    address: "",
    school_name: "",
    year_of_study: "",
    branch_id: "",
  });
  const [passwords, setPasswords] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [changePasswordForm, setChangePasswordForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  }); // Separate state for password change
  const [pictureFile, setPictureFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [canModify, setCanModify] = useState(true);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Refresh profile from backend to get last_profile_update_at
      try {
        const profile = await AuthService.getProfile();
        if (profile) {
          setUser(profile);
        }
      } catch {}
      const u = AuthService.getCurrentUser();
      if (u) {
        setForm({
          firstname: u.firstname || "",
          lastname: u.lastname || "",
          phone: u.phone || "",
          birth_date: u.birth_date || "",
          address: u.address || "",
          school_name: u.school_name || "",
          year_of_study: u.year_of_study || "",
          branch_id: u.branch_id || "",
        });
        // compute canModify
        if (u.last_profile_update_at) {
          const last = new Date(u.last_profile_update_at);
          const now = new Date();
          const diffHours = (now - last) / (1000 * 60 * 60);
          setCanModify(diffHours >= 24);
        } else {
          setCanModify(true);
        }
      }
    };
    init();
  }, []);

  // Load branches when year changes
  useEffect(() => {
    const loadBranches = async () => {
      if (
        form.year_of_study &&
        ["1AS", "2AS", "3AS"].includes(form.year_of_study)
      ) {
        setLoadingBranches(true);
        try {
          const response = await branchesService.getBranchesForYear(
            form.year_of_study,
          );
          setAvailableBranches(response.data || []);
        } catch (error) {
          console.error("Error loading branches:", error);
          setAvailableBranches([]);
        } finally {
          setLoadingBranches(false);
        }
      } else {
        setAvailableBranches([]);
        setForm((prev) => ({ ...prev, branch_id: "" }));
      }
    };

    loadBranches();
  }, [form.year_of_study]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const handlePassChange = (e) => {
    const { name, value } = e.target;
    setPasswords((p) => ({ ...p, [name]: value }));
  };

  const handleChangePasswordInput = (e) => {
    const { name, value } = e.target;
    setChangePasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitProfile = async (e) => {
    e.preventDefault();
    if (!canModify) {
      setError("لقد قمت بتعديل المعلومات اليوم، الرجاء المحاولة غداً");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Build multipart if picture is changing
      const fd = new FormData();

      // Liste des champs autorisés (SANS picture)
      const allowedFields = [
        "firstname",
        "lastname",
        "phone",
        "birth_date",
        "address",
        "school_name",
        "year_of_study",
        "branch_id",
      ];

      // Ajouter uniquement les champs autorisés
      allowedFields.forEach((field) => {
        if (form[field]) {
          // Convertir birth_date au format YYYY-MM-DD si c'est un ISO string
          if (
            field === "birth_date" &&
            typeof form[field] === "string" &&
            form[field].includes("T")
          ) {
            fd.append(field, form[field].split("T")[0]);
          } else {
            fd.append(field, form[field]);
          }
        }
      });

      // Ajouter le fichier picture si sélectionné
      if (pictureFile && pictureFile instanceof File) {
        fd.append("picture", pictureFile);
      }

      // No password required for profile modification (removed for UX)
      const updated = await AuthService.updateProfile(fd);
      if (updated) {
        setUser(updated);
        // Update the form with the new values including the picture URL
        setForm({
          firstname: updated.firstname || "",
          lastname: updated.lastname || "",
          phone: updated.phone || "",
          birth_date: updated.birth_date || "",
          address: updated.address || "",
          school_name: updated.school_name || "",
          year_of_study: updated.year_of_study || "",
          branch_id: updated.branch_id || "",
        });
        // Clear the picture file input
        setPictureFile(null);
        // Trigger a custom event to notify other components (ProfilePage)
        window.dispatchEvent(
          new CustomEvent("profileUpdated", { detail: updated }),
        );
        setSuccess("تم تحديث معلومات الحساب بنجاح");
        setCanModify(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || "فشل تحديث المعلومات");
    } finally {
      setLoading(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!changePasswordForm.current_password) {
        setError("كلمة المرور الحالية مطلوبة");
        setLoading(false);
        return;
      }
      if (changePasswordForm.new_password !== changePasswordForm.new_password_confirmation) {
        setError("تأكيد كلمة المرور غير مطابق");
        setLoading(false);
        return;
      }
      
      // Transform to API format
      const passwordData = {
        current_password: changePasswordForm.current_password,
        password: changePasswordForm.new_password,
        password_confirmation: changePasswordForm.new_password_confirmation,
      };
      
      await AuthService.changePassword(passwordData);
      setSuccess("تم تغيير كلمة المرور بنجاح");
      // mark local canModify false as backend will set last_profile_update_at
      setCanModify(false);
      setChangePasswordForm({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      });
    } catch (err) {
      setError(err.response?.data?.message || "فشل تغيير كلمة المرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">إعدادات الحساب</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded p-3 text-sm">
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>تعديل المعلومات الشخصية</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitProfile} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label>الاسم</Label>
              <Input
                name="firstname"
                value={form.firstname}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <Label>اللقب</Label>
              <Input
                name="lastname"
                value={form.lastname}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <Label>الهاتف</Label>
              <Input name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="space-y-1">
              <Label>تاريخ الميلاد</Label>
              <Input
                type="date"
                name="birth_date"
                value={form.birth_date}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <Label>العنوان</Label>
              <Input
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <Label>اسم المدرسة</Label>
              <Input
                name="school_name"
                value={form.school_name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1">
              <Label>السنة الدراسية</Label>
              <Input
                name="year_of_study"
                value={form.year_of_study}
                onChange={handleChange}
              />
            </div>
            {/* Branch Selection - Only for High School */}
            {["1AS", "2AS", "3AS"].includes(form.year_of_study) && (
              <div className="space-y-1">
                <Label>الفرع الدراسي</Label>
                <Select
                  value={form.branch_id}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, branch_id: value }))
                  }
                  disabled={loadingBranches}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingBranches
                          ? "جاري تحميل الفروع..."
                          : "اختر الفرع الدراسي"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <Label>صورة جديدة (اختياري)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setPictureFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={loading || !canModify}>
                {loading ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
            </div>
            {!canModify && (
              <p className="text-xs text-yellow-600 md:col-span-2">
                لقد قمت بتعديل بياناتك اليوم، الرجاء المحاولة بعد 24 ساعة.
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>تغيير كلمة المرور</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitPassword} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 md:col-span-2">
              <Label>كلمة المرور الحالية</Label>
              <Input
                type="password"
                name="current_password"
                value={changePasswordForm.current_password}
                onChange={handleChangePasswordInput}
                placeholder="أدخل كلمة المرور الحالية"
              />
            </div>
            <div className="space-y-1">
              <Label>كلمة المرور الجديدة</Label>
              <Input
                type="password"
                name="new_password"
                value={changePasswordForm.new_password}
                onChange={handleChangePasswordInput}
                placeholder="أدخل كلمة المرور الجديدة"
              />
            </div>
            <div className="space-y-1">
              <Label>تأكيد كلمة المرور الجديدة</Label>
              <Input
                type="password"
                name="new_password_confirmation"
                value={changePasswordForm.new_password_confirmation}
                onChange={handleChangePasswordInput}
                placeholder="أعد إدخال كلمة المرور الجديدة"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "جاري الحفظ..." : "تأكيد التغيير"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
