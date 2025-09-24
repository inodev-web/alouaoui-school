import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDateRangePicker } from "@/components/admin/date-range-picker"
import { Search, X } from "lucide-react"

export function StudentsFilters() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [selectedModule, setSelectedModule] = useState("")
  const [subscriptionStatus, setSubscriptionStatus] = useState("")

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedTeacher("")
    setSelectedModule("")
    setSubscriptionStatus("")
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={clearFilters} className="shrink-0 bg-transparent">
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by Teacher" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            <SelectItem value="sarah-johnson">Dr. Sarah Johnson</SelectItem>
            <SelectItem value="michael-chen">Prof. Michael Chen</SelectItem>
            <SelectItem value="emily-davis">Ms. Emily Davis</SelectItem>
            <SelectItem value="james-wilson">Dr. James Wilson</SelectItem>
            <SelectItem value="lisa-anderson">Prof. Lisa Anderson</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedModule} onValueChange={setSelectedModule}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            <SelectItem value="mathematics">Mathematics</SelectItem>
            <SelectItem value="physics">Physics</SelectItem>
            <SelectItem value="chemistry">Chemistry</SelectItem>
            <SelectItem value="biology">Biology</SelectItem>
            <SelectItem value="english">English</SelectItem>
          </SelectContent>
        </Select>

        <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Subscription Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <CalendarDateRangePicker />
      </div>
    </div>
  )
}
