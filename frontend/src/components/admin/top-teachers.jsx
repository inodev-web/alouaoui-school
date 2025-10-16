import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const teachers = [
  {
    name: "Dr. Sarah Johnson",
    module: "Mathematics",
    students: 45,
    avatar: "/teacher1.png",
  },
  {
    name: "Prof. Michael Chen",
    module: "Physics",
    students: 38,
    avatar: "/diverse-classroom-teacher.png",
  },
  {
    name: "Ms. Emily Davis",
    module: "Chemistry",
    students: 32,
    avatar: "/diverse-classroom-scene.png",
  },
  {
    name: "Dr. James Wilson",
    module: "Biology",
    students: 29,
    avatar: "/diverse-classroom-teacher.png",
  },
  {
    name: "Prof. Lisa Anderson",
    module: "English",
    students: 26,
    avatar: "/diverse-classroom-interaction.png",
  },
];

export function TopTeachers() {
  return (
    <div className="space-y-4">
      {teachers.map((teacher) => (
        <div key={teacher.name} className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={teacher.avatar || "/placeholder.svg"}
                alt={teacher.name}
              />
              <AvatarFallback>
                {teacher.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {teacher.name}
              </p>
              <p className="text-xs text-muted-foreground">{teacher.module}</p>
            </div>
          </div>
          <div className="text-sm font-medium text-foreground">
            {teacher.students} students
          </div>
        </div>
      ))}
    </div>
  );
}
