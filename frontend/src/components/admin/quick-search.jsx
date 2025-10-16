import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, User, GraduationCap } from "lucide-react";

const searchResults = [
  {
    type: "teacher",
    name: "Dr. Sarah Johnson",
    module: "Mathematics",
    status: "active",
  },
  {
    type: "teacher",
    name: "Prof. Michael Chen",
    module: "Physics",
    status: "expired",
  },
  {
    type: "module",
    name: "Chemistry",
    teacher: "Ms. Emily Davis",
    status: "active",
  },
];

export function QuickSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Simulate search results
      setResults(
        searchResults.filter((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    } else {
      setResults([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teachers or modules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Search Results:
          </h4>
          {results.map((result, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {result.type === "teacher" ? (
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{result.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.type === "teacher"
                          ? result.module
                          : `Teacher: ${result.teacher}`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      result.status === "active" ? "default" : "destructive"
                    }
                  >
                    {result.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
