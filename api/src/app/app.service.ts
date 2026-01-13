import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Role } from '../data';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  async onModuleInit() {
    await this.seedData();
  }

  private async seedData() {
    const orgCount = await this.organizationRepository.count();
    if (orgCount === 0) {
      const org = this.organizationRepository.create({ name: 'Example Org' });
      const savedOrg = await this.organizationRepository.save(org);

      const hashedPassword = await bcrypt.hash('owner123', 10);
      const owner = this.userRepository.create({
        email: 'owner@example.com',
        password: hashedPassword,
        name: 'Owner User',
        role: Role.OWNER,
        organizationId: savedOrg.id,
      });
      await this.userRepository.save(owner);

      const adminPassword = await bcrypt.hash('admin123', 10);
      const admin = this.userRepository.create({
        email: 'admin@example.com',
        password: adminPassword,
        name: 'Admin User',
        role: Role.ADMIN,
        organizationId: savedOrg.id,
      });
      await this.userRepository.save(admin);

      const viewerPassword = await bcrypt.hash('viewer123', 10);
      const viewer = this.userRepository.create({
        email: 'viewer@example.com',
        password: viewerPassword,
        name: 'Viewer User',
        role: Role.VIEWER,
        organizationId: savedOrg.id,
      });
      await this.userRepository.save(viewer);
    }
  }

  getData(): { message: string } {
    return { message: 'Hello API' };
  }
}
