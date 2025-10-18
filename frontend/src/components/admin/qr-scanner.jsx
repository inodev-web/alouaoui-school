import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StudentInfoModal } from "@/components/admin/student-info-modal";
import { QrCode, Camera, CameraOff, User, Phone, Mail } from "lucide-react";

// Mock student data that would come from QR scan
const mockStudentData = {
  id: "STU001",
  name: "Ahmed Hassan",
  phone: "+20 123 456 7890",
  email: "ahmed.hassan@email.com",
  subscriptionStatus: "active",
  teacher: "Dr. Sarah Johnson",
  module: "Mathematics",
  lastSession: "2024-01-20",
  totalSessions: 24,
};

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);

  const handleStartScan = () => {
    setIsScanning(true);
    // Simulate QR scan after 2 seconds
    setTimeout(() => {
      setScannedStudent(mockStudentData);
      setIsScanning(false);
      setShowStudentModal(true);
    }, 2000);
  };

  const handleStopScan = () => {
    setIsScanning(false);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Scanner Interface */}
        <div className="relative">
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-border">
            {isScanning ? (
              <div className="text-center">
                <div className="animate-pulse">
                  <QrCode className="h-16 w-16 mx-auto mb-4 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Scanning for QR code...
                </p>
                <div className="mt-4">
                  <div className="w-32 h-1 bg-primary/20 rounded-full mx-auto overflow-hidden">
                    <div className="w-full h-full bg-primary rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click start to begin scanning
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Scanner Controls */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button onClick={handleStartScan} className="flex-1">
              <Camera className="h-4 w-4 mr-2" />
              Start Scanner
            </Button>
          ) : (
            <Button
              onClick={handleStopScan}
              variant="destructive"
              className="flex-1"
            >
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Scanner
            </Button>
          )}
        </div>

        {/* Last Scanned Student */}
        {scannedStudent && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-green-800">
                Last Scanned Student
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">
                    {scannedStudent.name}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="border-green-600 text-green-700"
                >
                  {scannedStudent.subscriptionStatus}
                </Badge>
              </div>
              <div className="text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  {scannedStudent.phone}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-3 w-3" />
                  {scannedStudent.email}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowStudentModal(true)}
                className="w-full mt-2 border-green-600 text-green-700 hover:bg-green-100"
              >
                View Full Details
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {scannedStudent && (
        <StudentInfoModal
          student={scannedStudent}
          open={showStudentModal}
          onOpenChange={setShowStudentModal}
        />
      )}
    </>
  );
}
