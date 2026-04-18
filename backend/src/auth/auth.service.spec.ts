import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-uuid-1',
    tenantId: 'tenant-uuid-1',
    email: 'admin@ecole.mg',
    nom: 'Rakoto',
    prenom: 'Jean',
    role: 'admin',
    statut: true,
    passwordHash: '', // sera rempli dans beforeEach
  };

  beforeEach(async () => {
    // Hasher un vrai mot de passe pour les tests
    mockUser.passwordHash = await bcrypt.hash('motdepasse123', 10);

    const mockUsersService = {
      findByEmail: jest.fn(),
    };
    const mockJwtService = {
      sign: jest.fn().mockReturnValue('fake-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });

  // ---- TEST 1 : Login réussi ----
  it('doit retourner un access_token et les infos utilisateur si les identifiants sont corrects', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

    const result = await service.login({ email: 'admin@ecole.mg', password: 'motdepasse123' });

    expect(result.access_token).toBe('fake-jwt-token');
    expect(result.user.email).toBe('admin@ecole.mg');
    expect(result.user.nom).toBe('Rakoto');
    expect(result.user.role).toBe('admin');
    expect(result.user.tenantId).toBe('tenant-uuid-1');

    // Vérifier que le JWT a été signé avec le bon payload
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'user-uuid-1',
      email: 'admin@ecole.mg',
      role: 'admin',
      tenantId: 'tenant-uuid-1',
    });
  });

  // ---- TEST 2 : Email inexistant ----
  it('doit lever UnauthorizedException si l\'email n\'existe pas', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

    await expect(
      service.login({ email: 'inconnu@ecole.mg', password: 'motdepasse123' })
    ).rejects.toThrow(UnauthorizedException);
  });

  // ---- TEST 3 : Mauvais mot de passe ----
  it('doit lever UnauthorizedException si le mot de passe est incorrect', async () => {
    (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser);

    await expect(
      service.login({ email: 'admin@ecole.mg', password: 'mauvais_mdp' })
    ).rejects.toThrow(UnauthorizedException);
  });

  // ---- TEST 4 : Compte désactivé ----
  it('doit lever UnauthorizedException si le compte est inactif', async () => {
    const inactiveUser = { ...mockUser, statut: false };
    (usersService.findByEmail as jest.Mock).mockResolvedValue(inactiveUser);

    await expect(
      service.login({ email: 'admin@ecole.mg', password: 'motdepasse123' })
    ).rejects.toThrow(UnauthorizedException);
  });
});
