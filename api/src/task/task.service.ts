import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { CreateTaskDto, UpdateTaskDto } from '../data';
import { AuditService } from '../auth-lib';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private auditService: AuditService,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: any): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      createdById: user.userId,
      organizationId: user.organizationId,
    });
    const savedTask = await this.taskRepository.save(task);
    await this.auditService.log(user.userId, 'create', 'task', savedTask.id);
    return savedTask;
  }

  async findAll(user: any): Promise<Task[]> {
    return this.taskRepository.find({
      where: { organizationId: user.organizationId },
      relations: ['createdBy'],
    });
  }

  async findOne(id: number, user: any): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, organizationId: user.organizationId },
      relations: ['createdBy'],
    });
    if (task) {
      await this.auditService.log(user.userId, 'read', 'task', id);
    }
    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, user: any): Promise<Task> {
    await this.taskRepository.update({ id, organizationId: user.organizationId }, updateTaskDto);
    const task = await this.findOne(id, user);
    await this.auditService.log(user.userId, 'update', 'task', id);
    return task;
  }

  async remove(id: number, user: any): Promise<void> {
    await this.taskRepository.delete({ id, organizationId: user.organizationId });
    await this.auditService.log(user.userId, 'delete', 'task', id);
  }

  getAuditLogs() {
    return this.auditService.getLogs();
  }
}
