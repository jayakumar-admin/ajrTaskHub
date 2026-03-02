import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LayoutService {
  isSidebarOpen = signal(false); // Default closed on mobile, open on desktop? 
  // Actually, let's make it default closed on mobile. On desktop it's usually always open or toggleable.
  // Let's assume on desktop it starts open.
  
  isDesktopSidebarOpen = signal(true);

  toggleSidebar() {
    // This toggles the mobile sidebar usually, or both depending on implementation.
    // Let's handle them separately or unified.
    // Given the requirement "Fix overlay and alignment issues when the side navigation is toggled",
    // it implies a toggleable sidebar on desktop too.
    this.isDesktopSidebarOpen.update(v => !v);
    this.isSidebarOpen.update(v => !v); // For mobile
  }

  setSidebarState(isOpen: boolean) {
    this.isDesktopSidebarOpen.set(isOpen);
    this.isSidebarOpen.set(isOpen);
  }
}
