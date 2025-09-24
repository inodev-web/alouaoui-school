import React, { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Upload } from "lucide-react"

export function AddCourseModal({ chapterId, chapterTitle, trigger }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoLink: "",
    pdfFile: null,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, this would submit to an API
    console.log("Adding course to chapter:", chapterId, formData)
    setOpen(false)
    setFormData({
      title: "",
      description: "",
      videoLink: "",
      pdfFile: null,
    })
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null
    setFormData({ ...formData, pdfFile: file })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Course to {chapterTitle}</DialogTitle>
          <DialogDescription>Create a new course with video content and PDF materials.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="course-title" className="text-right">
                Title
              </Label>
              <Input
                id="course-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="col-span-3"
                placeholder="Course title"
                required
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="course-description" className="text-right mt-2">
                Description
              </Label>
              <Textarea
                id="course-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                placeholder="Course description"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="video-link" className="text-right">
                Video Link
              </Label>
              <Input
                id="video-link"
                type="url"
                value={formData.videoLink}
                onChange={(e) => setFormData({ ...formData, videoLink: e.target.value })}
                className="col-span-3"
                placeholder="https://youtube.com/watch?v=..."
                required
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pdf-file" className="text-right">
                PDF File
              </Label>
              <div className="col-span-3">
                <div className="flex items-center gap-2">
                  <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileChange} className="flex-1" />
                  <Button type="button" variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Upload summary or exercise PDF</p>
              </div>
            </div>

            {formData.pdfFile && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="text-sm font-medium">{formData.pdfFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(formData.pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Course</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
