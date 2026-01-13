import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  category: string;
  createdAt: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './tasks.html',
  styleUrls: ['./tasks.css'],
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  taskForm: FormGroup;
  editingTask: Task | null = null;
  categories = ['Work', 'Personal', 'General'];
  statuses = ['pending', 'in-progress', 'completed'];
  userRole: string = '';
  userName: string = '';
  isDarkMode: boolean = false;
  private taskChart?: Chart;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.taskForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      category: ['General', Validators.required],
      status: ['pending', Validators.required],
    });
  }

  ngOnInit() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    this.userRole = this.getRoleFromToken();
    this.isDarkMode = localStorage.getItem('darkMode') === 'true';
    this.applyTheme();
    this.loadTasks();
    // Poll for updates every 10 seconds
    setInterval(() => this.loadTasks(), 10000);
    // Keyboard shortcuts
    document.addEventListener('keydown', (event) => {
      if (event.key === 'n' && !event.ctrlKey && !event.metaKey) {
        this.resetForm();
        event.preventDefault();
      } else if (event.key === 'r' && !event.ctrlKey && !event.metaKey) {
        this.loadTasks();
        event.preventDefault();
      }
    });
  }

  getRoleFromToken(): string {
    const token = localStorage.getItem('token');
    if (!token) return '';
    try {
      const payload = this.decodeBase64Url(token.split('.')[1]);
      const decoded = JSON.parse(payload);
      console.log('User role:', decoded.role);
      return decoded.role;
    } catch (e) {
      console.error('Error decoding token:', e);
      return '';
    }
  }

  decodeBase64Url(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    return atob(str);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'pending': return 'text-red-600 font-semibold';
      case 'in-progress': return 'text-yellow-600 font-semibold';
      case 'completed': return 'text-green-600 font-semibold';
      default: return 'text-gray-600';
    }
  }

  getCardClass(status: string): string {
    switch (status) {
      case 'pending': return 'border-l-4 border-red-500';
      case 'in-progress': return 'border-l-4 border-yellow-500';
      case 'completed': return 'border-l-4 border-green-500';
      default: return '';
    }
  }

  loadTasks() {
    this.http.get<Task[]>('/api/tasks', { headers: this.getHeaders() }).subscribe({
      next: tasks => {
        this.tasks = tasks;
        this.getUserInfo(); // Fetch user info after tasks load
        this.renderChart();
      },
      error: err => console.error('Error loading tasks:', err)
    });
  }

  getUserInfo() {
    this.http.get<{name: string, email: string}>('/api/auth/me', { headers: this.getHeaders() }).subscribe({
      next: user => this.userName = user.name,
      error: err => console.error('Error fetching user info:', err)
    });
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  onSubmit() {
    if (this.taskForm.valid) {
      const taskData = this.taskForm.value;
      if (this.editingTask) {
        this.http.patch(`/api/tasks/${this.editingTask.id}`, taskData, { headers: this.getHeaders() }).subscribe(() => {
          this.loadTasks();
          this.resetForm();
        });
      } else {
        this.http.post('/api/tasks', taskData, { headers: this.getHeaders() }).subscribe(() => {
          this.loadTasks();
          this.resetForm();
        });
      }
    }
  }

  editTask(task: Task) {
    this.editingTask = task;
    this.taskForm.patchValue(task);
  }

  deleteTask(id: number) {
    this.http.delete(`/api/tasks/${id}`, { headers: this.getHeaders() }).subscribe(() => {
      this.loadTasks();
    });
  }

  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousIndex !== event.currentIndex) {
      const task = this.tasks[event.previousIndex];
      // For simplicity, cycle through statuses on drag
      const statuses = ['pending', 'in-progress', 'completed'];
      const currentIndex = statuses.indexOf(task.status);
      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
      
      this.updateStatus(task.id, { target: { value: nextStatus } } as any);
      moveItemInArray(this.tasks, event.previousIndex, event.currentIndex);
    }
  }

  resetForm() {
    this.taskForm.reset({ category: 'General', status: 'pending' });
    this.editingTask = null;
  }

  updateStatus(id: number, event: Event) {
    const target = event.target as HTMLSelectElement;
    const status = target.value;
    this.http.patch(`/api/tasks/${id}`, { status }, { headers: this.getHeaders() }).subscribe(() => {
      this.loadTasks();
    });
  }

  renderChart() {
    const statusCounts = {
      pending: this.tasks.filter(t => t.status === 'pending').length,
      inProgress: this.tasks.filter(t => t.status === 'in-progress').length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
    };

    const canvas = document.getElementById('taskChart') as HTMLCanvasElement | null;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Destroy previous chart to avoid stale data / memory leaks
    if (this.taskChart) {
      this.taskChart.destroy();
    }

    const gridColor = this.isDarkMode ? '#374151' : '#e5e7eb';
    const fontColor = this.isDarkMode ? '#d1d5db' : '#111827';

    this.taskChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Pending', 'In Progress', 'Completed'],
        datasets: [
          {
            label: 'Tasks',
            data: [statusCounts.pending, statusCounts.inProgress, statusCounts.completed],
            backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: fontColor } },
          tooltip: { enabled: true },
        },
        scales: {
          x: {
            ticks: { color: fontColor },
            grid: { color: gridColor },
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: fontColor },
            grid: { color: gridColor },
          },
        },
      },
    });
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('darkMode', this.isDarkMode.toString());
    this.applyTheme();
    // Re-render chart to apply theme colors
    this.renderChart();
  }

  applyTheme() {
    if (this.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
}
