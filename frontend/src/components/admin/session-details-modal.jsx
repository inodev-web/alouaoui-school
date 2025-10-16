import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer, Download } from "lucide-react";

const detailedSessions = [
  {
    id: "SES001",
    date: "2024-01-15",
    time: "10:00 AM",
    teacher: "Dr. Sarah Johnson",
    module: "Advanced Mathematics",
    duration: "2h",
    type: "subscription",
    students: 25,
    revenue: "$125",
    status: "completed",
  },
  {
    id: "SES002",
    date: "2024-01-15",
    time: "2:00 PM",
    teacher: "Prof. Michael Chen",
    module: "Quantum Physics",
    duration: "1.5h",
    type: "paid",
    students: 18,
    revenue: "$90",
    status: "completed",
  },
  {
    id: "SES003",
    date: "2024-01-14",
    time: "9:00 AM",
    teacher: "Ms. Emily Davis",
    module: "Organic Chemistry",
    duration: "2h",
    type: "free",
    students: 30,
    revenue: "$0",
    status: "completed",
  },
  {
    id: "SES004",
    date: "2024-01-14",
    time: "3:00 PM",
    teacher: "Dr. James Wilson",
    module: "Cell Biology",
    duration: "1h",
    type: "ma3fi",
    students: 12,
    revenue: "$0",
    status: "completed",
  },
  {
    id: "SES005",
    date: "2024-01-13",
    time: "11:00 AM",
    teacher: "Prof. Lisa Anderson",
    module: "Literature Analysis",
    duration: "2h",
    type: "subscription",
    students: 22,
    revenue: "$110",
    status: "completed",
  },
];

export function SessionDetailsModal() {
  const [open, setOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // In a real app, this would export to CSV/Excel
    console.log("Exporting session data...");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detailed Session Report</DialogTitle>
          <DialogDescription>
            Complete session breakdown with revenue analysis
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session ID</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detailedSessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-medium">{session.id}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{session.date}</div>
                    <div className="text-sm text-muted-foreground">
                      {session.time}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{session.teacher}</TableCell>
                <TableCell>{session.module}</TableCell>
                <TableCell>{session.duration}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      session.type === "subscription"
                        ? "default"
                        : session.type === "paid"
                          ? "secondary"
                          : session.type === "free"
                            ? "outline"
                            : "destructive"
                    }
                  >
                    {session.type}
                  </Badge>
                </TableCell>
                <TableCell>{session.students}</TableCell>
                <TableCell>
                  <Badge variant="outline">{session.status}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {session.revenue}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">97</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">1,234</div>
            <div className="text-sm text-muted-foreground">Total Students</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">$2,345</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
