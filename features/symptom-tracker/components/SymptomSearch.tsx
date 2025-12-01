import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SymptomSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const SymptomSearch = ({ value, onChange }: SymptomSearchProps) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search symptoms..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 rounded-lg"
      />
    </div>
  );
};
