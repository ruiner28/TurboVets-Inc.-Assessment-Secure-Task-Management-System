import { Injectable, CanActivate, ExecutionContext, SetMetadata, applyDecorators, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role, Permission } from '@repo/data';

export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const Permissions = (...permissions: string[]) => applyDecorators(
  SetMetadata(PERMISSIONS_KEY, permissions),
  UseGuards(RbacGuard),
);

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
    // Define permissions per role with inheritance
    const rolePermissions: Record<Role, string[]> = {
      [Role.OWNER]: ['create:task', 'read:task', 'update:task', 'delete:task', 'read:audit'],
      [Role.ADMIN]: ['create:task', 'read:task', 'update:task', 'delete:task'], // Inherits from lower roles
      [Role.VIEWER]: ['read:task'],
    };

    // Get permissions for user's role and all lower roles
    const userPermissions: string[] = [];
    if (userRole === Role.OWNER) {
      userPermissions.push(...rolePermissions[Role.OWNER]);
    } else if (userRole === Role.ADMIN) {
      userPermissions.push(...rolePermissions[Role.ADMIN], ...rolePermissions[Role.VIEWER]);
    } else if (userRole === Role.VIEWER) {
      userPermissions.push(...rolePermissions[Role.VIEWER]);
    }

    return requiredPermissions.every(perm => userPermissions.includes(perm));
  }
}

export const RequireAuth = () => UseGuards(RbacGuard);

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../api/src/entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(userId: number, action: string, resource: string, resourceId: number) {
    const log = this.auditLogRepository.create({
      userId,
      action,
      resource,
      resourceId,
    });
    await this.auditLogRepository.save(log);
    console.log(`Audit: User ${userId} ${action} ${resource} ${resourceId}`);
  }

  async getLogs(): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      order: { timestamp: 'DESC' },
      relations: ['user'],
    });
  }
}
