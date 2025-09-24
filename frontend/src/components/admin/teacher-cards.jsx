import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PaymentModal } from "@/components/admin/payment-modal"
import { Users, DollarSign, Calendar } from "lucide-react"

const teachers = [
  {
    id: "TCH001",
    name: "Dr. Sarah Johnson",
    module: "Mathematics",
    subscriptionStatus: "active",
    students: 45,
    monthlyPrice: 150,
    sessionPrice: 25,
    lastPayment: "2024-01-01",
    nextDue: "2024-02-01",
  },
  {
    id: "TCH002",
    name: "Prof. Michael Chen",
    module: "Physics",
    subscriptionStatus: "expired",
    students: 38,
    monthlyPrice: 140,
    sessionPrice: 23,
    lastPayment: "2023-12-01",
    nextDue: "2024-01-01",
  },
  {
    id: "TCH003",
    name: "Ms. Emily Davis",
    module: "Chemistry",
    subscriptionStatus: "active",
    students: 32,
    monthlyPrice: 145,
    sessionPrice: 24,
    lastPayment: "2024-01-05",
    nextDue: "2024-02-05",
  },
  {
    id: "TCH004",
    name: "Dr. James Wilson",
    module: "Biology",
    subscriptionStatus: "expired",
    students: 29,
    monthlyPrice: 155,
    sessionPrice: 26,
    lastPayment: "2023-11-15",
    nextDue: "2023-12-15",
  },
]

export function TeacherCards() {
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [paymentType, setPaymentType] = useState("monthly")

  const getStatusColor = (status) => {
    return status === "active" ? "default" : "destructive"
  }

  const getStatusIcon = (status) => {
    return status === "active" ? "🟢" : "🔴"
  }

  const handlePayment = (teacher, type) => {
    setSelectedTeacher(teacher)
    setPaymentType(type)
  }

  return (
    <>
      <div className="space-y-4">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>{getStatusIcon(teacher.subscriptionStatus)}</span>
                    {teacher.name}
                  </CardTitle>
                  <CardDescription>{teacher.module}</CardDescription>
                </div>
                <Badge variant={getStatusColor(teacher.subscriptionStatus)}>{teacher.subscriptionStatus}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{teacher.students} students</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>${teacher.monthlyPrice}/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due: {teacher.nextDue}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={teacher.subscriptionStatus === "active" ? "outline" : "default"}
                  onClick={() => handlePayment(teacher, "monthly")}
                  className="flex-1"
                >
                  Monthly Subscription
                  <span className="ml-2 font-bold">${teacher.monthlyPrice}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePayment(teacher, "session")}
                  className="flex-1"
                >
                  Per Session
                  <span className="ml-2 font-bold">${teacher.sessionPrice}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTeacher && (
        <PaymentModal
          teacher={selectedTeacher}
          paymentType={paymentType}
          open={!!selectedTeacher}
          onOpenChange={(open) => !open && setSelectedTeacher(null)}
        />
      )}
    </>
  )
}
