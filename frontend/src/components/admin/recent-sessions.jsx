import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const sessions = [
  {
    id: "SES001",
    date: "2024-01-15",
    teacher: "Dr. Sarah Johnson",
    module: "Mathematics",
    duration: "2h",
    type: "subscription",
    students: 25,
    revenue: "$125",
  },
  {
    id: "SES002",
    date: "2024-01-15",
    teacher: "Prof. Michael Chen",
    module: "Physics",
    duration: "1.5h",
    type: "paid",
    students: 18,
    revenue: "$90",
  },
  {
    id: "SES003",
    date: "2024-01-14",
    teacher: "Ms. Emily Davis",
    module: "Chemistry",
    duration: "2h",
    type: "free",
    students: 30,
    revenue: "$0",
  },
  {
    id: "SES004",
    date: "2024-01-14",
    teacher: "Dr. James Wilson",
    module: "Biology",
    duration: "1h",
    type: "ma3fi",
    students: 12,
    revenue: "$0",
  },
  {
    id: "SES005",
    date: "2024-01-13",
    teacher: "Prof. Lisa Anderson",
    module: "English",
    duration: "2h",
    type: "subscription",
    students: 22,
    revenue: "$110",
  },
];

export function RecentSessions() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session ID</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Teacher</TableHead>
          <TableHead>Module</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Students</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.id}>
            <TableCell className="font-medium">{session.id}</TableCell>
            <TableCell>{session.date}</TableCell>
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
            <TableCell className="text-right font-medium">
              {session.revenue}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
