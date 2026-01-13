import { Injectable, CanActivate, ExecutionContext, SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, Permission } from './data';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    if (requiredRoles) {
      return this.checkRoles(user.role, requiredRoles);
    }

    if (requiredPermissions) {
      return this.checkPermissions(user.role, requiredPermissions);
    }

    return false;
  }

  private checkRoles(userRole: Role, requiredRoles: Role[]): boolean {
    // Simple role check, can be extended for hierarchy
    return requiredRoles.includes(userRole);
  }

  private checkPermissions(userRole: Role, requiredPermissions: string[]): boolean {
    // Define permissions per role
    const rolePermissions: Record<Role, string[]> = {
      [Role.OWNER]: ['create:task', 'read:task', 'update:task', 'delete:task', 'read:audit'],
      [Role.ADMIN]: ['create:task', 'read:task', 'update:task', 'delete:task'],
      [Role.VIEWER]: ['read:task'],
    };

    const userPermissions = rolePermissions[userRole] || [];
    return requiredPermissions.every(perm => userPermissions.includes(perm));
  }
}

export const RequireAuth = () => UseGuards(RbacGuard);

@Injectable()
export class AuditService {
  private logs: any[] = [];

  log(userId: number, action: string, resource: string, resourceId: number) {
    this.logs.push({
      id: this.logs.length + 1,
      userId,
      action,
      resource,
      resourceId,
      timestamp: new Date(),
    });
    console.log(`Audit: User ${userId} ${action} ${resource} ${resourceId}`);
  }

  getLogs(): any[] {
    return this.logs;
  }
}
