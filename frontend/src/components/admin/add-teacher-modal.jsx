import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { UserPlus } from "lucide-react";
import { teachersService } from "@/services/teachersService";
import { useToast } from "../../hooks/use-toast";
import { cacheService } from "@/services/cache.service"; // ⚡ Cache
import { invalidateDashboardCache } from "@/hooks/useDashboardData"; // ⚡ Dashboard cache

export function AddTeacherModal({ onTeacherCreated }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    picture: "",
    module: "",
    percent_school: "",
    price_subscription: "",
    price_session: "",
    is_online_publisher: false, // false by default
    years: [],
  });

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

  const resetForm = () => {
    setFormData({
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
    setError(null);
  };

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
    setSubmitting(true);
    setError(null);
    try {
      // Build payload per backend teacher model
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
      await teachersService.createTeacher(payload);

      // ⚡ Invalidate cache after teacher creation
      cacheService.invalidateTeachers();
      invalidateDashboardCache();
      console.log("🔄 Teacher created - Cache invalidated");

      // Show success message
      toast({
        title: "تم إضافة الأستاذ بنجاح",
        description: `تم إنشاء حساب للأستاذ ${payload.name}`,
      });

      resetForm();
      setOpen(false);
      if (onTeacherCreated) onTeacherCreated();
    } catch (err) {
      const msg = err?.response?.data?.message || "حدث خطأ أثناء إنشاء الأستاذ";
      setError(msg);
      toast({
        title: "خطأ في إضافة الأستاذ",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="ml-2 h-4 w-4" />
          إضافة أستاذ
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <DialogHeader>
          <DialogTitle>إضافة أستاذ جديد</DialogTitle>
          <DialogDescription>
            إدخال معلومات الأستاذ حسب الحقول المتاحة.
          </DialogDescription>
        </DialogHeader>
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input
                id="name"
                required
                placeholder="مثال: محمد علي"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                required
                type="tel"
                placeholder="05XXXXXXXX"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="picture">رابط الصورة (اختياري)</Label>
              <Input
                id="picture"
                type="url"
                placeholder="https://..."
                value={formData.picture}
                onChange={(e) =>
                  setFormData({ ...formData, picture: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>المادة</Label>
              <Select
                value={formData.module}
                onValueChange={(value) =>
                  setFormData({ ...formData, module: value })
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
                <Label htmlFor="price_subscription">
                  سعر الاشتراك الشهري (دج)
                </Label>
                <Input
                  id="price_subscription"
                  type="number"
                  min="0"
                  placeholder="مثال: 1500"
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
                <Label htmlFor="price_session">سعر الحصة (دج)</Label>
                <Input
                  id="price_session"
                  type="number"
                  min="0"
                  placeholder="مثال: 400"
                  value={formData.price_session}
                  onChange={(e) =>
                    setFormData({ ...formData, price_session: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="percent_school">نسبة المدرسة (%)</Label>
                <Input
                  id="percent_school"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="مثال: 30"
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
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              disabled={submitting}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "جاري الحفظ..." : "حفظ الأستاذ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
