import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RoleEnum } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  // Helper pour simuler le contexte HTTP
  function createMockContext(user: any): ExecutionContext {
    return {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  // ---- TEST 1 : Pas de décorateur @Roles ----
  it('doit autoriser l\'accès si aucun rôle n\'est exigé (route publique)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ role: RoleEnum.student });
    
    expect(guard.canActivate(context)).toBe(true);
  });

  // ---- TEST 2 : Admin autorisé ----
  it('doit autoriser un admin sur une route réservée aux admin', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleEnum.admin]);
    const context = createMockContext({ role: RoleEnum.admin });

    expect(guard.canActivate(context)).toBe(true);
  });

  // ---- TEST 3 : Teacher bloqué ----
  it('doit refuser un teacher sur une route réservée aux admin', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleEnum.admin]);
    const context = createMockContext({ role: RoleEnum.teacher });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  // ---- TEST 4 : Rôles multiples ----
  it('doit autoriser un director si la route accepte admin OU director', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleEnum.admin, RoleEnum.director]);
    const context = createMockContext({ role: RoleEnum.director });

    expect(guard.canActivate(context)).toBe(true);
  });

  // ---- TEST 5 : Utilisateur sans rôle ----
  it('doit refuser un utilisateur sans rôle', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleEnum.admin]);
    const context = createMockContext({ role: undefined });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  // ---- TEST 6 : Utilisateur null ----
  it('doit refuser si l\'utilisateur est null (pas de token)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([RoleEnum.admin]);
    const context = createMockContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
