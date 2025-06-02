
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Calendar, MessageCircle } from "lucide-react";
import { MessageTemplate } from "@/hooks/useRealMessageTemplates";

interface MessageCardProps {
  template: MessageTemplate;
  onEdit: () => void;
}

const MessageCard = ({ template, onEdit }: MessageCardProps) => {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'boas-vindas': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-green-100 text-green-800';
      case 'renovação': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{template.code}</CardTitle>
            <Badge className={getCategoryColor(template.category)}>
              {template.category}
            </Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onEdit}
          >
            <Edit size={16} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {template.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>D+{template.dayOffset}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle size={14} />
            <span>{template.objective}</span>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm line-clamp-3">
            {template.content}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageCard;
