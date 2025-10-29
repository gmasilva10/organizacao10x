"use client";
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Menu, MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginDrawer } from "./LoginDrawer";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/lib/use-theme";
import { useFeature } from "@/lib/feature-flags";
import { UpgradeModal } from "@/components/UpgradeModal";
import { UpgradeBadge } from "@/components/Badges";

export function Header() {
  const { theme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const isDark = theme === "dark";
  const [mounted, setMounted] = useState(false);
  const onboarding = useFeature("features.onboarding.kanban");
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc = mounted
    ? isDark
      ? "/logo_branca.png"
      : "/logo_preta.png"
    : "/logo_preta.png";

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const menu = [
    { name: "Features", href: "#features" },
    { name: "Stats", href: "#stats" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      {showUpgrade && (
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          title="Limite do seu plano foi atingido"
          description="Para adicionar mais treinadores, faça upgrade para o plano Enterprise."
          primaryHref="/contact"
          secondaryHref="/planos"
        />
      )}
      <div className="container flex h-16 items-center justify-between max-w-full px-4">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="Home - Personal Global"
          suppressHydrationWarning
        >
          <Image
            src={logoSrc}
            alt="Personal Global"
            width={32}
            height={32}
            sizes="32px"
            className="object-contain [filter:brightness(0)_contrast(1.05)] dark:[filter:brightness(1)]"
          />
          <span className="font-bold text-xl">Personal Global</span>
        </Link>
        <label htmlFor="menu-toggle" className="lg:hidden cursor-pointer m-4">
          <MenuIcon aria-label="Toggle menu" />
        </label>
        <input
          type="checkbox"
          id="menu-toggle"
          className="hidden"
          aria-hidden="true"
        />
        <nav
          className="flex items-center gap-10  max-lg:w-full max-lg:fixed max-lg:top-full max-lg:flex-col max-lg:z-10"
          aria-label="Menu principal"
          suppressHydrationWarning
        >
          {menu.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium underline-offset-4 hover:underline hover:text-primary"
            >
              {item.name}
            </a>
          ))}

          {/* Onboarding sempre visível com guard de feature */}
          {onboarding.loading ? null : onboarding.enabled ? (
            <Link
              href="/app/onboarding"
              className="text-sm font-medium underline-offset-4 hover:underline hover:text-primary"
            >
              Onboarding
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
              aria-haspopup="dialog"
              className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
            >
              <span>Onboarding</span>
              <UpgradeBadge />
            </button>
          )}
          <div
            className="flex items-center gap-3"
            suppressHydrationWarning
          >
            <ThemeToggle />
            <LoginDrawer />
            <Button
              asChild
              size="sm"
              className="rounded-full bg-gradient-to-r from-primary to-accent"
            >
              <Link href="/signup">Começar agora</Link>
            </Button>
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
