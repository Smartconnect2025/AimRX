import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";

interface SearchInputProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const SearchInput = ({ searchTerm, setSearchTerm }: SearchInputProps) => {
  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="relative flex-1">
      <Search
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
        size={18}
      />
      <Input
        placeholder="Search resources..."
        className="pl-12 pr-12 h-11 rounded-[6px] border-gray-200 bg-white focus:border-gray-300 focus:ring-1 focus:ring-gray-300 focus-visible:ring-1 focus-visible:ring-gray-300"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {searchTerm && (
        <X
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600"
          size={18}
          onClick={clearSearch}
        />
      )}
    </div>
  );
};

export default SearchInput;
