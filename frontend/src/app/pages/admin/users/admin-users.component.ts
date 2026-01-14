import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ProjectService } from '../../../services/project.service';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <h2>👥 Gestión de Usuarios</h2>
        <button class="btn btn-primary" (click)="showCreate = true" *ngIf="!showCreate">
          + Nuevo Usuario
        </button>
      </div>

      <!-- Create/Edit Form -->
      <div class="card form-section" *ngIf="showCreate">
        <h3>{{ newUser.id ? 'Editar Usuario' : 'Crear Nuevo Usuario' }}</h3>
        <form (submit)="saveUser()">
          <div class="form-row">
            <div class="form-group">
              <label>Nombre Completo</label>
              <input type="text" [(ngModel)]="newUser.full_name" name="name" placeholder="Juan Pérez" class="form-control" required>
            </div>
            <div class="form-group">
              <label>Código de Acceso</label>
              <input type="text" [(ngModel)]="newUser.access_code" name="code" placeholder="USER001" class="form-control" required>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Rol</label>
              <div class="radio-inline">
                <label><input type="radio" [(ngModel)]="newUser.role" name="role" value="User"> Usuario</label>
                <label><input type="radio" [(ngModel)]="newUser.role" name="role" value="Admin"> Administrador</label>
              </div>
            </div>
            <div class="form-group" *ngIf="newUser.id">
              <label>Estado</label>
              <div class="radio-inline">
                <label><input type="radio" [(ngModel)]="newUser.is_active" name="active" [value]="true"> Activo</label>
                <label><input type="radio" [(ngModel)]="newUser.is_active" name="active" [value]="false"> Inactivo</label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Proyectos Asignados</label>
            <div class="checkbox-grid">
              <label *ngFor="let p of availableProjects" class="checkbox-item">
                <input type="checkbox" [checked]="selectedProjectIds.has(p.id)" (change)="toggleProject(p.id)"> 
                {{ p.name }}
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-success">{{ newUser.id ? '💾 Guardar Cambios' : '✨ Crear Usuario' }}</button>
            <button type="button" class="btn btn-outline" (click)="resetForm()">Cancelar</button>
          </div>
        </form>
      </div>

      <!-- Users Table -->
      <div class="table-section" *ngIf="!showCreate">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Código</th>
                <th>Rol</th>
                <th>Proyectos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users" [class.inactive-row]="!user.is_active">
                <td class="cell-name"><strong>{{ user.full_name }}</strong></td>
                <td><code class="code-badge">{{ user.access_code }}</code></td>
                <td>
                  <span [class]="'role-badge role-' + (user.role === 'Admin' ? 'admin' : 'user')">
                    {{ user.role }}
                  </span>
                </td>
                <td class="text-center">{{ user.projects_count }}</td>
                <td>
                  <span [class]="'status-badge ' + (user.is_active ? 'status-active' : 'status-inactive')">
                    {{ user.is_active ? '🟢 Activo' : '🔴 Inactivo' }}
                  </span>
                </td>
                <td class="cell-actions">
                  <button class="btn btn-sm btn-outline" (click)="editUser(user)" title="Editar usuario">✏️</button>
                  <button class="btn btn-sm" 
                    [ngClass]="user.is_active ? 'btn-danger' : 'btn-success'"
                    (click)="toggleUserStatus(user)"
                    [title]="user.is_active ? 'Desactivar usuario' : 'Activar usuario'">
                    {{ user.is_active ? '⏸️' : '▶️' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container {
      padding: var(--spacing-lg);
      max-width: 1200px;
      margin: 0 auto;
    }

    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-2xl);
    }

    .admin-header h2 {
      font-size: var(--font-size-2xl);
      color: var(--secondary);
      margin: 0;
    }

    .form-section {
      margin-bottom: var(--spacing-2xl);
    }

    .form-section h3 {
      margin-top: 0;
      margin-bottom: var(--spacing-lg);
      color: var(--secondary);
      border-bottom: 2px solid var(--primary);
      padding-bottom: var(--spacing-md);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: var(--font-weight-semibold);
      color: var(--dark);
      margin-bottom: var(--spacing-sm);
      font-size: var(--font-size-sm);
    }

    .form-control {
      padding: var(--spacing-sm) var(--spacing-md);
      border: var(--border-width) solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: var(--font-size-base);
      transition: all var(--transition-fast);
    }

    .form-control:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.1);
    }

    .radio-inline {
      display: flex;
      gap: var(--spacing-lg);
    }

    .radio-inline label {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin: 0;
      font-weight: var(--font-weight-normal);
    }

    .checkbox-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-sm);
      transition: background-color var(--transition-fast);
    }

    .checkbox-item:hover {
      background-color: var(--gray-100);
    }

    .form-actions {
      display: flex;
      gap: var(--spacing-md);
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-lg);
      border-top: var(--border-width) solid var(--border-color);
    }

    .table-section {
      background: white;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table thead {
      background-color: var(--gray-100);
      border-bottom: 2px solid var(--border-color);
    }

    .data-table th {
      padding: var(--spacing-md) var(--spacing-lg);
      text-align: left;
      font-weight: var(--font-weight-semibold);
      color: var(--secondary);
      font-size: var(--font-size-sm);
    }

    .data-table td {
      padding: var(--spacing-md) var(--spacing-lg);
      border-bottom: var(--border-width) solid var(--border-color);
    }

    .data-table tbody tr {
      transition: background-color var(--transition-fast);
    }

    .data-table tbody tr:hover {
      background-color: #fafafa;
    }

    .data-table tbody tr.inactive-row {
      opacity: 0.6;
      background-color: #f5f5f5;
    }

    .cell-name {
      font-weight: var(--font-weight-semibold);
      color: var(--secondary);
    }

    .code-badge {
      background-color: #f0f0f0;
      padding: 4px 8px;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: #666;
    }

    .role-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: var(--border-radius-full);
      font-size: 0.75rem;
      font-weight: var(--font-weight-semibold);
    }

    .role-admin {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .role-user {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: var(--font-weight-medium);
    }

    .status-active {
      background-color: #e8f5e9;
      color: #2e7d32;
    }

    .status-inactive {
      background-color: #ffebee;
      color: #c62828;
    }

    .text-center {
      text-align: center;
    }

    .cell-actions {
      display: flex;
      gap: var(--spacing-sm);
    }

    @media (max-width: 768px) {
      .admin-header {
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .checkbox-grid {
        grid-template-columns: 1fr;
      }

      .data-table th,
      .data-table td {
        padding: var(--spacing-sm) var(--spacing-md);
        font-size: var(--font-size-xs);
      }

      .btn {
        padding: 6px 12px;
        font-size: var(--font-size-xs);
      }
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  showCreate = false;
  newUser: any = { full_name: '', access_code: '', role: 'User', project_ids: [], is_active: true };
  selectedProjectIds: Set<number> = new Set();

  availableProjects: any[] = [];
  users: any[] = [];

  constructor(
    private adminService: AdminService,
    private projectService: ProjectService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.loadUsers();
    this.loadProjects();
  }

  loadUsers() {
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (error) => {
        this.toastService.error('Error al cargar usuarios');
      }
    });
  }

  loadProjects() {
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.availableProjects = data;
      },
      error: (error) => {
        this.toastService.error('Error al cargar proyectos');
      }
    });
  }

  toggleProject(id: number) {
    if (this.selectedProjectIds.has(id)) {
      this.selectedProjectIds.delete(id);
    } else {
      this.selectedProjectIds.add(id);
    }
  }

  saveUser() {
    if (!this.newUser.full_name || !this.newUser.access_code) {
      this.toastService.warning('Por favor completa todos los campos requeridos');
      return;
    }

    const payload = {
      full_name: this.newUser.full_name,
      access_code: this.newUser.access_code,
      is_admin: this.newUser.role === 'Admin',
      is_active: this.newUser.is_active !== undefined ? this.newUser.is_active : true,
      project_ids: Array.from(this.selectedProjectIds)
    };

    if (this.newUser.id) {
      this.adminService.updateUser(this.newUser.id, payload).subscribe({
        next: () => {
          this.toastService.success('Usuario actualizado correctamente');
          this.resetForm();
          this.loadUsers();
        },
        error: (error) => {
          this.toastService.error(`Error: ${error.error?.detail || error.message}`);
        }
      });
    } else {
      this.adminService.createUser(payload).subscribe({
        next: () => {
          this.toastService.success('Usuario creado correctamente');
          this.resetForm();
          this.loadUsers();
        },
        error: (error) => {
          this.toastService.error(`Error: ${error.error?.detail || error.message}`);
        }
      });
    }
  }

  editUser(user: any) {
    this.newUser = { ...user };
    this.selectedProjectIds = new Set();
    this.showCreate = true;
  }

  toggleUserStatus(user: any) {
    const newStatus = !user.is_active;
    const accion = newStatus ? 'activar' : 'desactivar';
    const mensaje = newStatus 
      ? `¿Activar a ${user.full_name}? Podrá acceder nuevamente.`
      : `¿Desactivar a ${user.full_name}? No podrá acceder al sistema.`;

    if (confirm(mensaje)) {
      this.adminService.updateUser(user.id, { is_active: newStatus }).subscribe({
        next: () => {
          this.toastService.success(`Usuario ${accion}do correctamente`);
          this.loadUsers();
        },
        error: (error) => {
          this.toastService.error(`Error al ${accion} usuario`);
        }
      });
    }
  }

  resetForm() {
    this.showCreate = false;
    this.newUser = { full_name: '', access_code: '', role: 'User', project_ids: [], is_active: true };
    this.selectedProjectIds.clear();
  }
}
