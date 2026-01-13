export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  organizationId: number;
  role: Role;
}

export interface Organization {
  id: number;
  name: string;
  parentId?: number;
}

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  category: string;
  createdById: number;
  organizationId: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateTaskDto {
  title: string;
  description: string;
  category: string;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  category?: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: number;
  organizationId: number;
  role: Role;
}

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resource: string;
  resourceId: number;
  timestamp: Date;
}
