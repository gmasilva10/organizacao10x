import React from "react";
import logoImage from "@/assets/brain-logo-actual.png";
import { Outlet } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  contentTitle?: string;
  contentDescription?: string;
}

export const AuthLayout = ({ 
  children, 
  title, 
  subtitle,
  contentTitle,
  contentDescription
}: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f8ff]">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex justify-center mb-4">
            <img src={logoImage} alt="Organização 10x Logo" className="h-16" />
          </div>
          <h1 className="text-3xl font-bold text-[#0C6CA1]">{title}</h1>
          <p className="mt-1 text-gray-600">{subtitle}</p>
        </div>
        
        <div className="rounded-lg bg-white p-8 shadow-md">
          {contentTitle && <h2 className="text-2xl font-semibold mb-1">{contentTitle}</h2>}
          {contentDescription && <p className="text-sm text-gray-600 mb-6">{contentDescription}</p>}
          
          {children}
        </div>
      </div>
    </div>
  );
};
