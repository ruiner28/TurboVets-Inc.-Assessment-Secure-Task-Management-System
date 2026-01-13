import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RbacGuard } from './auth';
import { Role } from '../data';

describe('RbacGuard', () => {
  let guard: RbacGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacGuard,
        Reflector,
      ],
    }).compile();

    guard = module.get<RbacGuard>(RbacGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow access if no roles or permissions required', () => {
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.ADMIN } }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });

    it('should check roles', () => {
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.ADMIN } }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce([Role.ADMIN, Role.OWNER])
        .mockReturnValueOnce(null);

      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });

    it('should check permissions', () => {
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user: { role: Role.ADMIN } }),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(['read:task']);

      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });

    it('should deny access if no user', () => {
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      };

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

      const result = guard.canActivate(context as any);

      expect(result).toBe(false);
    });
  });
});