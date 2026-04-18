import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const mockPrisma = {
      extended: {
        user: { findUnique: jest.fn(), findFirst: jest.fn() }
      }
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma }
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('doit être défini', () => {
    expect(service).toBeDefined();
  });
});
