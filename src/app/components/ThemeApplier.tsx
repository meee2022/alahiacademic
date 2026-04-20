"use client";

import { useEffect } from "react";

export default function ThemeApplier() {
  useEffect(() => {
    const applyTheme = () => {
      const savedSettings = localStorage.getItem("academy_settings");
      if (savedSettings) {
        try {
          const { appearance } = JSON.parse(savedSettings);
          if (appearance) {
            const root = document.documentElement;
            
            if (appearance.primaryColor) {
              root.style.setProperty("--primary-color", appearance.primaryColor);
              // Calculate a darker version for hover states if needed, 
              // or just use the same for simplicity for now
              root.style.setProperty("--primary-color-dark", appearance.primaryColor);
            }
            
            if (appearance.accentColor) {
              root.style.setProperty("--accent-color", appearance.accentColor);
            }
            
            if (appearance.fontSize) {
              let fSize = "16px";
              if (appearance.fontSize === "small") fSize = "14px";
              if (appearance.fontSize === "large") fSize = "18px";
              root.style.setProperty("--base-font-size", fSize);
            }
          }
        } catch (e) {
          console.error("Failed to parse theme settings", e);
        }
      }
    };

    applyTheme();
    
    // Listen for storage changes (if user has two tabs open)
    window.addEventListener("storage", applyTheme);
    
    // Custom event for same-window updates from settings page
    window.addEventListener("theme-changed", applyTheme);

    return () => {
      window.removeEventListener("storage", applyTheme);
      window.removeEventListener("theme-changed", applyTheme);
    };
  }, []);

  return null;
}
