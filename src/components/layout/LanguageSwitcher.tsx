import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600">
      <Globe className="h-4 w-4" />
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent outline-none cursor-pointer"
      >
        <option value="es">Español</option>
        <option value="en">English</option>
      </select>
    </div>
  );
};
