"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Video, FileText, Clock, ExternalLink, Download } from "lucide-react";

export function CourseDetailsModal({ course, open, onOpenChange }) {
  const handleWatchVideo = () => {
    window.open(course.videoLink, "_blank");
  };

  const handleDownloadPDF = () => {
    // In a real app, this would trigger PDF download
    console.log("Downloading PDF:", course.pdfUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {course.title}
          </DialogTitle>
          <DialogDescription>Course ID: {course.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Course Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Description
                </h4>
                <p className="text-sm">{course.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{course.duration}</span>
                </div>
                <Badge variant="outline">Video Course</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Video Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Content
              </CardTitle>
              <CardDescription>Main course video lesson</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Video Lesson</p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {course.duration}
                  </p>
                </div>
                <Button onClick={handleWatchVideo}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Watch Video
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PDF Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PDF Materials
              </CardTitle>
              <CardDescription>
                Supplementary materials and exercises
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Course Summary & Exercises</p>
                  <p className="text-sm text-muted-foreground">
                    PDF document with key concepts and practice problems
                  </p>
                </div>
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button>Edit Course</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
