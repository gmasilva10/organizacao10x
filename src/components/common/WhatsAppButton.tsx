
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WhatsAppButtonProps {
  phone?: string;
  size?: "sm" | "md" | "lg";
  variant?: "icon" | "text";
  className?: string;
}

const WhatsAppButton = ({ phone, size = "md", variant = "icon", className }: WhatsAppButtonProps) => {
  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const getIconSize = () => {
    switch(size) {
      case "sm": return 14;
      case "md": return 16;
      case "lg": return 20;
      default: return 16;
    }
  };

  const getButtonSize = () => {
    switch(size) {
      case "sm": return "h-6 w-6";
      case "md": return "h-8 w-8";
      case "lg": return "h-10 w-10";
      default: return "h-8 w-8";
    }
  };

  if (variant === "text") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleWhatsAppClick}
        className={`text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700 ${className}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={getIconSize()}
          height={getIconSize()}
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
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleWhatsAppClick}
          className={`${getButtonSize()} text-green-600 hover:text-green-700 hover:bg-green-50 ${className}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={getIconSize()}
            height={getIconSize()}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Abrir WhatsApp</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default WhatsAppButton;
