import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { TaskModule } from '../task/task.module';
import { User } from '../entities/user.entity';
import { Organization } from '../entities/organization.entity';
import { Task } from '../entities/task.entity';
import { AuditLog } from '../entities/audit-log.entity';
import { RbacGuard, AuditService } from '../auth-lib';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, Organization, Task, AuditLog],
      synchronize: true, // For dev
    }),
    TypeOrmModule.forFeature([User, Organization, AuditLog]),
    AuthModule,
    TaskModule,
  ],
  controllers: [AppController],
  providers: [AppService, RbacGuard, AuditService],
})
export class AppModule {}
