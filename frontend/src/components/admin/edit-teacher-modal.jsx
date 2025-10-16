import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { teachersService } from "@/services/teachersService";
import { cacheService } from "@/services/cache.service"; // ⚡ Cache
import { invalidateDashboardCache } from "@/hooks/useDashboardData"; // ⚡ Dashboard cache

export function EditTeacherModal({
  teacher,
  open,
  onOpenChange,
  onTeacherUpdated,
}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    picture: "",
    module: "",
    percent_school: "",
    price_subscription: "",
    price_session: "",
    is_online_publisher: false,
    years: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const YEAR_OPTIONS = [
    { value: "1AM", label: "السنة الأولى متوسط" },
    { value: "2AM", label: "السنة الثانية متوسط" },
    { value: "3AM", label: "السنة الثالثة متوسط" },
    { value: "4AM", label: "السنة الرابعة متوسط" },
    { value: "1AS", label: "السنة الأولى ثانوي" },
    { value: "2AS", label: "السنة الثانية ثانوي" },
    { value: "3AS", label: "السنة الثالثة ثانوي" },
  ];
  const MODULE_OPTIONS = [
    { value: "math", label: "الرياضيات" },
    { value: "physique", label: "الفيزياء" },
    { value: "chimie", label: "الكيمياء" },
    { value: "svt", label: "علوم الطبيعة و الحياة" },
    { value: "francais", label: "اللغة الفرنسية" },
    { value: "anglais", label: "اللغة الإنجليزية" },
    { value: "arabe", label: "اللغة العربية" },
    { value: "histoire", label: "التاريخ" },
    { value: "geographie", label: "الجغرافيا" },
    { value: "philosophie", label: "الفلسفة" },
    { value: "informatique", label: "الإعلام الآلي" },
  ];

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || "",
        phone: teacher.phone || "",
        picture: teacher.picture || "",
        module: teacher.module || "",
        percent_school: teacher.percent_school?.toString() || "",
        price_subscription: teacher.price_subscription?.toString() || "",
        price_session: teacher.price_session?.toString() || "",
        is_online_publisher: !!teacher.is_online_publisher,
        years: teacher.years || [],
      });
      setError(null);
    }
  }, [teacher]);

  const toggleYear = (year) => {
    setFormData((prev) => {
      const exists = prev.years.includes(year);
      return {
        ...prev,
        years: exists
          ? prev.years.filter((y) => y !== year)
          : [...prev.years, year],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teacher?.uuid) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        picture: formData.picture || null,
        module: formData.module || null,
        percent_school: formData.percent_school
          ? parseInt(formData.percent_school, 10)
          : null,
        price_subscription: formData.price_subscription
          ? parseFloat(formData.price_subscription)
          : null,
        price_session: formData.price_session
          ? parseFloat(formData.price_session)
          : null,
        is_online_publisher: !!formData.is_online_publisher,
        years: formData.years,
      };
      await teachersService.updateTeacher(teacher.uuid, payload);
      
      // ⚡ Invalidate cache after teacher update
      cacheService.invalidateTeachers();
      invalidateDashboardCache();
      console.log("🔄 Teacher updated - Cache invalidated");
      
      if (onTeacherUpdated) onTeacherUpdated();
      onOpenChange(false);
    } catch (err) {
      const msg = err?.response?.data?.message || "فشل تحديث بيانات الأستاذ";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>تعديل بيانات الأستاذ</DialogTitle>
          <DialogDescription>
            قم بتحديث المعلومات ثم اضغط حفظ.
          </DialogDescription>
        </DialogHeader>
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="t-name">الاسم الكامل</Label>
              <Input
                id="t-name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-phone">رقم الهاتف</Label>
              <Input
                id="t-phone"
                required
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="t-picture">رابط الصورة</Label>
              <Input
                id="t-picture"
                type="url"
                value={formData.picture}
                onChange={(e) =>
                  setFormData({ ...formData, picture: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <Label>المادة</Label>
              <Select
                value={formData.module}
                onValueChange={(val) =>
                  setFormData({ ...formData, module: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المادة" />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>السنوات الدراسية</Label>
              <div className="grid grid-cols-2 gap-2">
                {YEAR_OPTIONS.map((y) => (
                  <label
                    key={y.value}
                    className="flex items-center gap-2 text-sm bg-gray-50 rounded px-2 py-1 border"
                  >
                    <Checkbox
                      checked={formData.years.includes(y.value)}
                      onCheckedChange={() => toggleYear(y.value)}
                    />
                    <span>{y.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t-price-sub">سعر الاشتراك الشهري (دج)</Label>
                <Input
                  id="t-price-sub"
                  type="number"
                  min="0"
                  value={formData.price_subscription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_subscription: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-price-session">سعر الحصة (دج)</Label>
                <Input
                  id="t-price-session"
                  type="number"
                  min="0"
                  value={formData.price_session}
                  onChange={(e) =>
                    setFormData({ ...formData, price_session: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t-percent">نسبة المدرسة (%)</Label>
                <Input
                  id="t-percent"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.percent_school}
                  onChange={(e) =>
                    setFormData({ ...formData, percent_school: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 pt-6">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={formData.is_online_publisher}
                    onCheckedChange={(val) =>
                      setFormData({ ...formData, is_online_publisher: !!val })
                    }
                  />
                  ناشر إلكتروني؟
                </label>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "جاري الحفظ..." : "حفظ التعديلات"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
