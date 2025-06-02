import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Cake, Calendar, RefreshCw, Filter, Bell } from "lucide-react";
import UnifiedTasksModal from "./UnifiedTasksModal";
import CategoryModal from "./CategoryModal";

// Define notification categories and their clients
const notificationGroups = [
  {
    title: "Novos Clientes",
    value: "novos-clientes",
    count: 0,
    color: "bg-blue-100 text-blue-600",
    icon: UserPlus,
  },
  {
    title: "Aniversariantes", 
    value: "aniversariantes",
    count: 0,
    color: "bg-purple-100 text-purple-600",
    icon: Cake,
  },
  {
    title: "Treinos",
    value: "treinos",
    count: 0,
    color: "bg-green-100 text-green-600",
    icon: Calendar,
  },
  {
    title: "Renovações",
    value: "renovacoes",
    count: 0,
    color: "bg-yellow-100 text-yellow-600",
    icon: RefreshCw,
  }
];

const NotificationsList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [filter, setFilter] = useState('7dias');
  const [categoryFilter, setCategoryFilter] = useState('todas');

  // Filter notifications based on selected filters
  const getFilteredNotifications = () => {
    let filteredGroups = notificationGroups;
    
    if (categoryFilter !== 'todas') {
      filteredGroups = notificationGroups.filter(group => group.value === categoryFilter);
    }
    
    // Here you would apply time filtering logic based on actual data
    // For now, we'll just return the groups as they are
    return filteredGroups;
  };

  const handleCategoryClick = (categoryValue: string) => {
    setSelectedCategory(categoryValue);
    setIsCategoryModalOpen(true);
  };

  const filteredNotifications = getFilteredNotifications();
  const totalCount = filteredNotifications.reduce((sum, group) => sum + group.count, 0);

  return (
    <>
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-700">Notificações</h3>
            <p className="text-sm text-gray-500">Eventos importantes e alertas</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsModalOpen(true)}
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            Ver todas
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-500" />
            <select 
              className="text-xs border border-gray-200 rounded px-2 py-1"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="hoje">Hoje</option>
              <option value="7dias">Próximos 7 dias</option>
              <option value="30dias">Próximos 30 dias</option>
              <option value="todas">Todas as datas</option>
            </select>
          </div>
          
          <select 
            className="text-xs border border-gray-200 rounded px-2 py-1"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="todas">Todas as categorias</option>
            <option value="novos-clientes">Novos Clientes</option>
            <option value="aniversariantes">Aniversariantes</option>
            <option value="treinos">Treinos</option>
            <option value="renovacoes">Renovações</option>
          </select>
        </div>

        {filteredNotifications.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Bell className="mx-auto mb-2 text-gray-400" size={32} />
              <p>Não há notificações para os filtros selecionados.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {filteredNotifications.map((group) => {
                const IconComponent = group.icon;
                return (
                  <div 
                    key={group.title} 
                    className={`${group.color} bg-opacity-20 p-3 rounded-md hover:bg-opacity-30 transition-colors cursor-pointer`}
                    onClick={() => handleCategoryClick(group.value)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <IconComponent size={16} className={group.color.split(" ")[1]} />
                      <div className="text-sm font-medium">{group.title}</div>
                    </div>
                    <div className={`text-xl font-bold ${group.color.split(" ")[1]}`}>
                      {group.count}
                    </div>
                  </div>
                );
              })}
            </div>

            {totalCount > 0 && (
              <div className="mt-4 p-2 bg-gray-50 rounded text-center">
                <div className="text-sm text-gray-600">
                  Total: <span className="font-semibold text-gray-800">{totalCount}</span> notificações
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <UnifiedTasksModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        initialTab="notifications"
      />

      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        category={selectedCategory}
      />
    </>
  );
};

export default NotificationsList;
