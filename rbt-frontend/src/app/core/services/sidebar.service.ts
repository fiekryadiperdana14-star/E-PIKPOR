import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  isOpen = signal<boolean>(false);

  toggle(): void {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  }

  close(): void {
    this.isOpen.set(false);
    document.body.classList.remove('sidebar-open');
  }

  open(): void {
    this.isOpen.set(true);
    document.body.classList.add('sidebar-open');
  }
}
