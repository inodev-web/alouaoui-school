import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen } from "lucide-react"

const iconOptions = [
  { value: "📐", label: "📐 Ruler" },
  { value: "⚛️", label: "⚛️ Atom" },
  { value: "🧪", label: "🧪 Test Tube" },
  { value: "🔬", label: "🔬 Microscope" },
  { value: "📚", label: "📚 Books" },
  { value: "🌍", label: "🌍 Globe" },
  { value: "🎨", label: "🎨 Art" },
  { value: "🎵", label: "🎵 Music" },
  { value: "💻", label: "💻 Computer" },
  { value: "🏛️", label: "🏛️ Building" },
]

export function CreateChapterModal() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    icon: "",
    module: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, this would submit to an API
    console.log("Creating chapter:", formData)
    setOpen(false)
    setFormData({
      title: "",
      icon: "",
      module: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <BookOpen className="mr-2 h-4 w-4" />
          Create Chapter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Chapter</DialogTitle>
          <DialogDescription>Add a new chapter to organize your course content.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-3"
                placeholder="Chapter title"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                Icon
              </Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="module" className="text-right">
                Module
              </Label>
              <Select value={formData.module} onValueChange={(value) => setFormData({ ...formData, module: value })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Biology">Biology</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Geography">Geography</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Chapter</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
