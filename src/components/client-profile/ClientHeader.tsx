
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Client } from "@/types";

interface ClientHeaderProps {
  client: Client;
  handleEdit: () => void;
  handleDelete: () => void;
  handleWhatsApp: () => void;
}

const ClientHeader = ({ client, handleEdit, handleDelete, handleWhatsApp }: ClientHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center mb-6 gap-4">
      <Button 
        variant="ghost" 
        size="sm" 
        className="p-0 h-8 w-8"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={20} />
      </Button>
      
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
        <p className="text-sm text-gray-600">Cliente desde {new Date(client.startDate).toLocaleDateString("pt-BR")}</p>
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="default" 
          className="bg-green-500 hover:bg-green-600"
          onClick={handleWhatsApp}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          WhatsApp
        </Button>
        <Button 
          variant="outline"
          onClick={handleEdit}
        >
          <Pencil size={18} className="mr-1" />
          Editar
        </Button>
        <Button 
          variant="outline" 
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          onClick={handleDelete}
        >
          <Trash2 size={18} className="mr-1" />
          Excluir
        </Button>
      </div>
    </div>
  );
};

export default ClientHeader;
