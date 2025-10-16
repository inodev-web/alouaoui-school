import { CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react";

export function StudentInfoModal({ student, open, onOpenChange }) {
  const handleCheckIn = () => {
    // In a real app, this would record the check-in
    onOpenChange(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "default";
      case "expired":
        return "destructive";
      case "trial":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Check-In
          </DialogTitle>
          <DialogDescription>
            Verify student information and complete check-in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Student Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{student.name}</CardTitle>
              <CardDescription>Student ID: {student.id}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Student Image */}
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 shadow-md">
                  <img
                    src={
                      student.picture ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || "")}&background=0D8ABC&color=fff&size=200`
                    }
                    alt={student.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || "")}&background=0D8ABC&color=fff&size=200`;
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{student.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{student.email}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {student.teacher} - {student.module}
                  </span>
                </div>
                <Badge variant={getStatusColor(student.subscriptionStatus)}>
                  {student.subscriptionStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Last Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{student.lastSession}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Total Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {student.totalSessions} sessions
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Check-in Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCheckIn}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Check-In
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
