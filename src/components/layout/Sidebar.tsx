import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { LayoutDashboard, Package, ArrowRightLeft, Users, LogOut, Box, Tags, ShoppingCart, FileText } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const links = [
    { to: "/", icon: LayoutDashboard, label: t('menu.dashboard'), roles: ["admin", "sales", "viewer"] },
    { to: "/pos", icon: ShoppingCart, label: t('menu.pos'), roles: ["admin", "sales"] },
    { to: "/products", icon: Package, label: t('menu.products'), roles: ["admin", "sales", "viewer"] },
    { to: "/categories", icon: Tags, label: t('menu.categories'), roles: ["admin"] },
    { to: "/inventory", icon: ArrowRightLeft, label: t('menu.inventory'), roles: ["admin", "sales"] },
    { to: "/sales-history", icon: FileText, label: t('menu.salesHistory'), roles: ["admin", "sales"] },
    { to: "/users", icon: Users, label: t('menu.users'), roles: ["admin"] },
  ];

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white md:flex print:hidden">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <Box className="mr-2 h-6 w-6 text-blue-600" />
        <span className="text-lg font-bold text-slate-900">StockMaster</span>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {links.map((link) => {
            if (!link.roles.includes(user?.role || "")) return null;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                <link.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-4 space-y-4">
        <LanguageSwitcher />
        
        <div className="flex items-center">
            <img src={user?.avatar} alt={user?.name} className="h-8 w-8 rounded-full mr-3" />
            <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="truncate text-xs text-slate-500 capitalize">{t(`users.roles.${user?.role}`)}</p>
            </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          {t('auth.signOut')}
        </button>
      </div>
    </aside>
  );
};
