import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { QrCode, Search, User } from "lucide-react";
import { StudentCheckinDialog } from "./student-checkin-dialog";
import { studentService } from "@/services/api/student.service";

export function StudentIdInput() {
  const [studentId, setStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [student, setStudent] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState("");

  // Auto-focus on input when component mounts
  useEffect(() => {
    const input = document.getElementById("student-id-input");
    if (input) {
      input.focus();
    }
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setStudentId(value);
    setError("");

    // Auto-submit when QR scanner inputs data (usually ends with Enter or specific length)
    if (value.length >= 8 && (value.includes("\n") || value.includes("\r"))) {
      handleSearch(value.replace(/[\n\r]/g, ""));
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && studentId.trim()) {
      handleSearch(studentId.trim());
    }
  };

  const handleSearch = async (id = studentId) => {
    if (!id.trim()) {
      setError("يرجى إدخال معرف الطالب");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Get student with today's sessions and subscription status
      const studentData = await studentService.getStudentWithSessions(id);
      setStudent(studentData);
      setShowDialog(true);
      setStudentId(""); // Clear input after successful search
    } catch (err) {
      setError(err.response?.data?.message || "لم يتم العثور على الطالب");
      setStudent(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDialogClose = () => {
    setShowDialog(false);
    setStudent(null);
    // Refocus on input after dialog closes
    setTimeout(() => {
      const input = document.getElementById("student-id-input");
      if (input) {
        input.focus();
      }
    }, 100);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            مسح معرف الطالب
          </CardTitle>
          <CardDescription className="text-right">
            أدخل معرف الطالب يدوياً أو استخدم ماسح QR المتصل بـ USB
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              id="student-id-input"
              type="text"
              placeholder="أدخل معرف الطالب..."
              value={studentId}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className="text-right"
              disabled={isLoading}
            />
            {error && (
              <p className="text-sm text-red-600 text-right">{error}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => handleSearch()}
              disabled={isLoading || !studentId.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  جاري البحث...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  البحث عن الطالب
                </div>
              )}
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground text-right space-y-1">
            <p>• استخدم ماسح QR المتصل بـ USB لمسح معرف الطالب تلقائياً</p>
            <p>• أو أدخل المعرف يدوياً واضغط Enter</p>
            <p>• سيتم عرض جلسات المعلمين لهذا اليوم مع حالة الاشتراك</p>
          </div>
        </CardContent>
      </Card>

      {student && (
        <StudentCheckinDialog
          student={student}
          open={showDialog}
          onOpenChange={handleDialogClose}
        />
      )}
    </>
  );
}
