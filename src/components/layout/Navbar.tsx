import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  ClipboardList,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import logoImage from "@/assets/new-logo-actual.png";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationsMenu from "./NotificationsMenu";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { MobileSidebar } from "./MobileSidebar";

const Navbar = () => {
  const location = useLocation();
  const { user, organization, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileName, setProfileName] = useState<string>("");

  useEffect(() => {
    const fetchProfileName = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();
          
          if (data && !error) {
            setProfileName(data.full_name || user.email?.split('@')[0] || "");
          }
        } catch (error) {
          console.error("Error fetching profile name:", error);
        }
      }
    };
    
    fetchProfileName();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out from Navbar:", error);
    }
  };

  const isActive = (path: string) => {
    if (path === "/onboarding" && location.pathname === "/") return true;
    return location.pathname === path;
  };
  
  // Get user initials for avatar
  const getInitials = () => {
    if (profileName) {
      const nameParts = profileName.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return profileName.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };
  
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Organization Name */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src={logoImage} alt="Organização 10x Logo" className="h-10 mr-3" />
              <span className="font-bold text-xl text-[#0C6CA1]">Organização 10x</span>
            </Link>
          </div>

          {/* Main Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <NavItem to="/" label="Onboarding" active={isActive("/") || isActive("/onboarding")} />
            <NavItem to="/dashboard" label="Dashboard" active={isActive("/dashboard")} />
            <NavItem to="/cadastro" label="Cadastros" active={isActive("/cadastro")} />
            <NavItem to="/relacionamento" label="Relacionamento" active={isActive("/relacionamento")} />
            <NavItem to="/analise" label="Análise" active={isActive("/analise")} />
          </nav>

          {/* Notifications and User Menu */}
          <div className="flex items-center gap-2">
            <NotificationsMenu />
            
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-8 p-0 gap-2" onClick={() => setOpen(!open)}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gray-100 text-gray-800">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-sm text-right mr-2">
                    <p className="font-medium">{profileName || user?.email?.split('@')[0]}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-2">
                <div className="flex flex-col space-y-1">
                  <Link to="/configuracoes" className="flex items-center p-2 rounded-md hover:bg-gray-100">
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="text-sm">Configurações</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center p-2 rounded-md hover:bg-gray-100 w-full text-left"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="text-sm">Sair</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </header>
  );
};

// Navigation Item Component
const NavItem = ({ to, label, active }: { to: string; label: string; active: boolean }) => {
  return (
    <Link
      to={to}
      className={`px-4 py-2 text-sm font-medium transition-colors hover:text-[#0C6CA1] ${
        active ? "text-[#0C6CA1] font-semibold border-b-2 border-[#0C6CA1]" : "text-gray-600"
      }`}
    >
      {label}
    </Link>
  );
};

export default Navbar;
