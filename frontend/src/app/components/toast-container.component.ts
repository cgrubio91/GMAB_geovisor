import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts" 
        [class]="'toast toast-' + toast.type"
        [@slideIn]>
        <div class="toast-content">
          <span class="toast-icon">{{ getIcon(toast.type) }}</span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button class="toast-close" (click)="closeToast(toast.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: var(--z-toast);
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      border-radius: var(--border-radius);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      box-shadow: var(--shadow-lg);
      animation: slideIn 0.3s ease-out;
      pointer-events: auto;
    }

    .toast-success {
      background-color: #e8f5e9;
      color: #2e7d32;
      border-left: 4px solid var(--success);
    }

    .toast-error {
      background-color: #ffebee;
      color: #c62828;
      border-left: 4px solid var(--danger);
    }

    .toast-warning {
      background-color: #fff3e0;
      color: #e65100;
      border-left: 4px solid var(--warning);
    }

    .toast-info {
      background-color: #e3f2fd;
      color: #1565c0;
      border-left: 4px solid var(--info);
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toast-icon {
      font-size: 20px;
      font-weight: bold;
    }

    .toast-message {
      flex: 1;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 24px;
      color: inherit;
      opacity: 0.7;
      transition: opacity 0.2s;
      padding: 0;
      margin-left: 12px;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      .toast-container {
        right: 10px;
        left: 10px;
        max-width: none;
      }

      .toast {
        padding: 12px 14px;
        font-size: var(--font-size-xs);
      }

      .toast-icon {
        font-size: 18px;
      }
    }
  `]
})
export class ToastContainerComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) { }

  ngOnInit() {
    this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  closeToast(id: string) {
    this.toastService.remove(id);
  }

  getIcon(type: string): string {
    const icons: { [key: string]: string } = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || 'ℹ';
  }
}
