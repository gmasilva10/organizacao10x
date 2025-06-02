
import React from "react";
import { Search } from "lucide-react";

interface ClientSearchProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

const ClientSearch = ({ searchTerm, setSearchTerm }: ClientSearchProps) => {
  return (
    <div className="relative flex-1 max-w-md">
      <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Buscar clientes..."
        className="pl-10 pr-4 py-2 border border-gray-200 rounded-md w-full"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
};

export default ClientSearch;
