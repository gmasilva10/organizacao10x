
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, text, active, onClick }) => {
  return (
    <li>
      {to ? (
        <Link
          to={to}
          className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-100 ${
            active ? "bg-gray-100" : ""
          }`}
        >
          <span className="mr-3 text-gray-500">{icon}</span>
          <span>{text}</span>
        </Link>
      ) : (
        <button
          onClick={onClick}
          className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-100 text-left"
        >
          <span className="mr-3 text-gray-500">{icon}</span>
          <span>{text}</span>
        </button>
      )}
    </li>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { user, organization, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso!");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  return (
    <div className="bg-white h-full flex flex-col border-r fixed left-0 top-0 w-64 z-30">
      <div className="p-4 border-b">
        <div className="flex items-center justify-center">
          <h1 className="font-bold text-xl">Negociação 10x</h1>
        </div>
      </div>
      
      <div className="p-4 border-b">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600 mb-2">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <h2 className="font-medium">{organization?.organization_name}</h2>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          <NavItem
            to="/"
            icon={<Home size={20} />}
            text="Dashboard"
            active={location.pathname === "/"}
          />
          <NavItem
            to="/cadastro"
            icon={<Users size={20} />}
            text="Cadastro"
            active={location.pathname === "/cadastro"}
          />
          <NavItem
            to="/onboarding"
            icon={<ClipboardList size={20} />}
            text="Onboarding"
            active={location.pathname === "/onboarding"}
          />
          <NavItem
            to="/relacionamento"
            icon={<MessageSquare size={20} />}
            text="Relacionamento"
            active={location.pathname === "/relacionamento"}
          />
          <NavItem
            to="/analise"
            icon={<BarChart3 size={20} />}
            text="Análise"
            active={location.pathname === "/analise"}
          />
          <NavItem
            to="/configuracoes"
            icon={<Settings size={20} />}
            text="Configurações"
            active={location.pathname === "/configuracoes"}
          />
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <NavItem
          to=""
          icon={<LogOut size={20} />}
          text="Sair"
          onClick={handleSignOut}
        />
      </div>
    </div>
  );
};

export default Sidebar;
