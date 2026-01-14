import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { ProjectService } from '../../../services/project.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-projects',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="projects-container">
      <div class="list-header">
        <h2>Gestión de Proyectos</h2>
        <button class="btn btn-primary" (click)="showCreate = true" *ngIf="!showCreate">
          + Nuevo Proyecto
        </button>
      </div>

      <!-- Create/Edit Form -->
      <div class="card form-panel" *ngIf="showCreate">
        <h3>{{ newProject.id ? 'Editar Proyecto' : 'Crear Nuevo Proyecto' }}</h3>
        <form (submit)="saveProject()">
          <div class="form-grid">
            <div class="form-group">
              <label>Nombre del Proyecto</label>
              <input type="text" [(ngModel)]="newProject.name" name="name" placeholder="Nombre del proyecto" class="form-control">
            </div>
            <div class="form-group">
              <label>Ubicación</label>
              <input type="text" [(ngModel)]="newProject.location" name="location" placeholder="Ciudad / Región" class="form-control">
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>Fecha de Inicio</label>
              <input type="date" [(ngModel)]="newProject.start_date" name="start_date" class="form-control">
            </div>
            <div class="form-group">
              <label>Etapa del Proyecto</label>
              <select [(ngModel)]="newProject.stage" name="stage" class="form-control">
                <option value="Planificación">Planificación</option>
                <option value="Ejecución">Ejecución</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Suspendido">Suspendido</option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>Descripción</label>
            <textarea [(ngModel)]="newProject.description" name="description" placeholder="Descripción del proyecto" class="form-control" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Personal Asignado</label>
            <div class="checkbox-list">
              <label *ngFor="let u of availableUsers">
                <input type="checkbox" [checked]="selectedUserIds.has(u.id)" (change)="toggleUser(u.id)"> {{ u.full_name }} ({{ u.role }})
              </label>
            </div>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">{{ newProject.id ? 'Guardar Cambios' : 'Crear' }}</button>
            <button type="button" class="btn btn-outline" (click)="resetForm()">Cancelar</button>
          </div>
        </form>
      </div>

      <!-- Projects List - Table View -->
      <div class="table-section" *ngIf="!showCreate">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Proyecto</th>
                <th>Ubicación</th>
                <th>Usuarios</th>
                <th>Capas</th>
                <th>Etapa</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of projects" [class.inactive-row]="p.status === 'inactive'">
                <td class="cell-name"><strong>{{ p.name }}</strong></td>
                <td>{{ p.location || '-' }}</td>
                <td class="text-center">{{ p.users_count }}</td>
                <td class="text-center">{{ p.layers_count }}</td>
                <td>
                  <span class="stage-badge">{{ p.stage }}</span>
                </td>
                <td>
                  <span [class]="'status-badge ' + (p.status === 'active' ? 'status-active' : 'status-inactive')">
                    {{ p.status === 'active' ? '🟢 Activo' : '🔴 Inactivo' }}
                  </span>
                </td>
                <td class="cell-actions">
                  <button class="btn btn-sm btn-outline" (click)="editProject(p)" title="Editar proyecto">✏️</button>
                  <button class="btn btn-sm" 
                    [ngClass]="p.status === 'active' ? 'btn-warning' : 'btn-success'"
                    (click)="toggleProjectStatus(p)"
                    *ngIf="isAdmin"
                    [title]="p.status === 'active' ? 'Desactivar proyecto' : 'Activar proyecto'">
                    {{ p.status === 'active' ? '⏸️' : '▶️' }}
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
    .projects-container {
      padding: var(--spacing-lg);
      max-width: 1200px;
      margin: 0 auto;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-2xl);
    }

    .list-header h2 {
      font-size: var(--font-size-2xl);
      color: var(--secondary);
      margin: 0;
    }

    .card {
      background-color: white;
      border: var(--border-width) solid var(--border-color);
      border-radius: var(--border-radius);
      padding: var(--spacing-lg);
      box-shadow: var(--shadow-sm);
    }

    .form-panel {
      margin-bottom: var(--spacing-2xl);
    }

    .form-panel h3 {
      margin-top: 0;
      margin-bottom: var(--spacing-lg);
      color: var(--secondary);
      border-bottom: 2px solid var(--primary);
      padding-bottom: var(--spacing-md);
    }

    .form-grid {
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

    .checkbox-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-md);
    }

    .checkbox-list label {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      padding: var(--spacing-sm);
      border-radius: var(--border-radius-sm);
      transition: background-color var(--transition-fast);
      font-weight: var(--font-weight-normal);
    }

    .checkbox-list label:hover {
      background-color: var(--gray-100);
    }

    .form-actions {
      display: flex;
      gap: var(--spacing-md);
      margin-top: var(--spacing-lg);
      padding-top: var(--spacing-lg);
      border-top: var(--border-width) solid var(--border-color);
    }

    .btn {
      padding: var(--spacing-sm) var(--spacing-md);
      font-weight: var(--font-weight-semibold);
      border: none;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .btn-primary {
      background-color: var(--primary);
      color: white;
      border: 2px solid var(--primary);
    }

    .btn-primary:hover {
      background-color: var(--primary-dark);
      border-color: var(--primary-dark);
      box-shadow: var(--shadow-md);
    }

    .btn-outline {
      background-color: white;
      color: var(--primary);
      border: 2px solid var(--primary);
    }

    .btn-outline:hover {
      background-color: var(--primary);
      color: white;
    }

    .btn-success {
      background-color: var(--success);
      color: white;
      border: 2px solid var(--success);
    }

    .btn-success:hover {
      background-color: #45a049;
      border-color: #45a049;
      box-shadow: var(--shadow-md);
    }

    .btn-warning {
      background-color: var(--warning);
      color: white;
      border: 2px solid var(--warning);
    }

    .btn-warning:hover {
      background-color: #e68900;
      border-color: #e68900;
      box-shadow: var(--shadow-md);
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: var(--font-size-sm);
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

    .stage-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: var(--border-radius-full);
      font-size: 0.75rem;
      font-weight: var(--font-weight-semibold);
      background-color: #e8f5e9;
      color: #2e7d32;
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
      .list-header {
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .data-table th,
      .data-table td {
        padding: var(--spacing-sm) var(--spacing-md);
        font-size: var(--font-size-xs);
      }
    }
  `]
})
export class AdminProjectsComponent {
  showCreate = false;
  newProject: any = { name: '', description: '', user_ids: [] };
  selectedUserIds: Set<number> = new Set();

  availableUsers: any[] = [];
  projects: any[] = [];
  isAdmin: boolean = false;

  constructor(
    private projectService: ProjectService,
    private adminService: AdminService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadProjects();
    this.loadUsers();
    this.checkAdminStatus();
  }

  checkAdminStatus() {
    const user = this.authService.getCurrentUserSync();
    this.isAdmin = user ? user.is_admin : false;
  }

  loadProjects() {
    this.adminService.getProjectsSummary().subscribe(data => {
      this.projects = data;
    });
  }

  loadUsers() {
    this.adminService.getUsers().subscribe(data => {
      this.availableUsers = data;
    });
  }

  toggleUser(id: number) {
    if (this.selectedUserIds.has(id)) {
      this.selectedUserIds.delete(id);
    } else {
      this.selectedUserIds.add(id);
    }
  }

  saveProject() {
    const payload: any = {
      name: this.newProject.name,
      description: this.newProject.description,
      location: this.newProject.location,
      start_date: this.newProject.start_date,
      stage: this.newProject.stage,
      user_ids: Array.from(this.selectedUserIds)
    };

    if (this.newProject.id) {
      this.projectService.updateProject(this.newProject.id, payload).subscribe(() => {
        this.resetForm();
        this.loadProjects();
      });

    } else {
      // Create new
      this.projectService.createProject(payload).subscribe(() => {
        this.resetForm();
        this.loadProjects();
      });
    }
  }

  editProject(p: any) {
    this.projectService.getProject(p.id).subscribe(details => {
      this.newProject = {
        ...details,
        start_date: details.start_date ? details.start_date.split('T')[0] : ''
      };
      this.selectedUserIds = new Set(details.users?.map((u: any) => u.id) || []);
      this.showCreate = true;
    });
  }

  toggleProjectStatus(p: any) {
    const accion = p.status === 'active' ? 'desactivar' : 'activar';
    const mensaje = p.status === 'active' 
      ? `¿Desactivar el proyecto "${p.name}"? Los usuarios no podrán acceder a él.`
      : `¿Activar el proyecto "${p.name}"? Los usuarios podrán acceder nuevamente.`;
    
    if (confirm(mensaje)) {
      this.projectService.toggleProjectStatus(p.id).subscribe(
        () => {
          this.loadProjects();
          alert(`Proyecto ${accion}do correctamente`);
        },
        error => {
          alert(`Error al ${accion} el proyecto: ${error.error?.detail || error.message}`);
        }
      );
    }
  }

  resetForm() {
    this.showCreate = false;
    this.newProject = { name: '', description: '', user_ids: [] };
    this.selectedUserIds.clear();
  }
}

