import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private apiUrl = '/api/v1/projects';

    constructor(private http: HttpClient) { }

    /**
     * Obtener proyectos con opciones de búsqueda y filtrado
     */
    getProjects(options?: {
        search?: string,
        status?: string,
        sort_by?: string,
        skip?: number,
        limit?: number
    }): Observable<any[]> {
        let params = new HttpParams();
        
        if (options?.search) {
            params = params.set('search', options.search);
        }
        if (options?.status) {
            params = params.set('status', options.status);
        }
        if (options?.sort_by) {
            params = params.set('sort_by', options.sort_by);
        }
        if (options?.skip !== undefined) {
            params = params.set('skip', options.skip.toString());
        }
        if (options?.limit !== undefined) {
            params = params.set('limit', options.limit.toString());
        }
        
        return this.http.get<any[]>(this.apiUrl, { params });
    }

    getProject(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    createProject(project: any): Observable<any> {
        return this.http.post<any>(this.apiUrl, project);
    }

    updateProject(id: number, project: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, project);
    }

    deleteProject(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/${id}`);
    }

    toggleProjectStatus(id: number): Observable<any> {
        const token = localStorage.getItem('auth_token');
        const headers = token ? new HttpHeaders({
            'Authorization': `Bearer ${token}`
        }) : undefined;
        
        return this.http.post<any>(`${this.apiUrl}/${id}/toggle-status`, {}, 
            headers ? { headers } : {});
    }
}
