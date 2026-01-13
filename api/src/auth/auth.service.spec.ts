import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { User } from '../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if valid', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        password: '$2a$10$hashedpassword',
        name: 'Test User',
        organizationId: 1,
        role: 'admin',
        organization: { id: 1, name: 'Org' },
      };

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user as any);
      jest.spyOn(require('bcryptjs'), 'compare').mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        relations: ['organization'],
      });
      expect(result).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        organizationId: 1,
        role: 'admin',
        organization: { id: 1, name: 'Org' },
      });
    });

    it('should return null if invalid', async () => {
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access token', async () => {
      const user = {
        id: 1,
        email: 'test@example.com',
        organizationId: 1,
        role: 'admin',
      };
      const loginDto = { email: 'test@example.com', password: 'password' };

      jest.spyOn(service, 'validateUser').mockResolvedValue(user as any);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      const result = await service.login(loginDto);

      expect(service.validateUser).toHaveBeenCalledWith('test@example.com', 'password');
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: 1,
        organizationId: 1,
        role: 'admin',
      });
      expect(result).toEqual({ access_token: 'token' });
    });
  });
});