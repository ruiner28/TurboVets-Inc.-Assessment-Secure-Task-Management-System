import { Route } from '@angular/router';
import { LoginComponent } from './login/login';
import { TasksComponent } from './tasks/tasks';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'tasks', component: TasksComponent },
];
