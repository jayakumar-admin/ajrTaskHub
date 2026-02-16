
import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'indigo' | 'teal' | 'rose';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<Theme>('indigo');
  isDarkMode = signal(true); // Default to dark mode
  
  themes: { id: Theme, name: string }[] = [
    { id: 'indigo', name: 'Indigo' },
    { id: 'teal', name: 'Teal' },
    { id: 'rose', name: 'Rose' },
  ];

  constructor() {
    // Load theme from local storage on startup
    const storedTheme = localStorage.getItem('app-theme') as Theme;
    if (storedTheme && this.themes.some(t => t.id === storedTheme)) {
      this.currentTheme.set(storedTheme);
    }

    // Load dark mode preference from local storage on startup
    const storedDarkMode = localStorage.getItem('darkMode');
    if (storedDarkMode !== null) {
      this.isDarkMode.set(JSON.parse(storedDarkMode));
    } else {
      this.isDarkMode.set(true); // Explicitly default to true if nothing is stored
    }

    // Effect to apply theme class and dark mode class to the html element
    effect(() => {
      const theme = this.currentTheme();
      const darkMode = this.isDarkMode();
      const htmlElement = document.documentElement;

      // --- Apply Theme Class ---
      // Remove any existing theme classes
      this.themes.forEach(t => {
        htmlElement.classList.remove(`theme-${t.id}`);
      });
      // Add the new theme class
      htmlElement.classList.add(`theme-${theme}`);
      localStorage.setItem('app-theme', theme);

      // --- Apply Dark Mode Class ---
      if (darkMode) {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    });
  }

  setTheme(theme: Theme): void {
    if (this.themes.some(t => t.id === theme)) {
      this.currentTheme.set(theme);
    }
  }

  toggleDarkMode(): void {
    this.isDarkMode.update(value => !value);
  }
}
