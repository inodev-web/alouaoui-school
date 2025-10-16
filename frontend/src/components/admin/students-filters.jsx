import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export function StudentsFilters({ onSearchChange, onClearFilters }) {
  const [search, setSearch] = useState("");

  const handleSearch = useCallback(() => {
    onSearchChange(search.trim());
  }, [search, onSearchChange]);

  const clearFilters = useCallback(() => {
    setSearch("");
    onClearFilters();
  }, [onClearFilters]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch],
  );

  const handleInputChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  return (
    <div className="space-y-4 mb-6" dir="rtl">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث بالاسم أو اللقب أو رقم الهاتف... (اضغط Enter للبحث)"
            value={search}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="text-right pr-10"
          />
        </div>

        <Button onClick={handleSearch} variant="default" size="sm">
          <Search className="h-4 w-4 ml-2" />
          بحث
        </Button>

        {search && (
          <Button variant="outline" onClick={clearFilters} size="sm">
            <X className="h-4 w-4 ml-2" />
            مسح
          </Button>
        )}
      </div>
    </div>
  );
}
