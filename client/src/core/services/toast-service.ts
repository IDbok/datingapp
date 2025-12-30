import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private router = inject(Router);

  constructor() {
    this.createToastContainer();
  }

  private createToastContainer() {
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast toast-bottom toast-end z-50';
      document.body.appendChild(container);
    }
  }

  private createToastElement(message: string, alertClass: string, duration = 5000, 
    avatarUrl?: string, routerLink?: string) {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.classList.add('alert', alertClass, 'shadow-lg', 'flex', 
      'items-center', 'gap-3', 'cursor-pointer');

    if (routerLink) {
      toast.addEventListener('click', () => {
        this.router.navigate([routerLink]);
      });
    }

    toast.innerHTML = `
      ${avatarUrl ? `<img src=${avatarUrl || '/user.png'} alt='Avatar' class='w-10 h-10 rounded'>` : ''}
      <span>${message}</span>
      <button class="ml-4 btn btn-sm btn-ghost">x</button>
    `;

    toast.querySelector('button')?.addEventListener('click', () => {
      toastContainer.removeChild(toast);
    });

    toastContainer.append(toast);

    setTimeout(() => {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, duration);
  }

  success(message: string, duration?: number, avatarUrl?: string, routerLink?: string) {
    this.createToastElement(message, 'alert-success', duration, avatarUrl, routerLink);
  }

  error(message: string, duration?: number, avatarUrl?: string, routerLink?: string) {
    this.createToastElement(message, 'alert-error', duration, avatarUrl, routerLink);
  }

  warning(message: string, duration?: number, avatarUrl?: string, routerLink?: string) {
    this.createToastElement(message, 'alert-warning', duration, avatarUrl, routerLink);
  }

  info(message: string, duration?: number, avatarUrl?: string, routerLink?: string) {
    this.createToastElement(message, 'alert-info', duration, avatarUrl, routerLink);
  }
}
