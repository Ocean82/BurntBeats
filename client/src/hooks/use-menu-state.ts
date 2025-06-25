
import { useState, useEffect } from 'react';

export const useMenuState = (defaultMenu: string = "New Song") => {
  const [activeMenu, setActiveMenuState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeMenu');
      return saved || defaultMenu;
    }
    return defaultMenu;
  });

  const setActiveMenu = (menu: string) => {
    setActiveMenuState(menu);
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeMenu', menu);
    }
  };

  // Clear menu state when needed (e.g., logout)
  const clearMenuState = () => {
    setActiveMenuState(defaultMenu);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('activeMenu');
    }
  };

  return {
    activeMenu,
    setActiveMenu,
    clearMenuState
  };
};
