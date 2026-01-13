import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskService } from './task.service';
import { Task } from '../entities/task.entity';
import { AuditService } from '../auth-lib';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;
  let auditService: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useClass: Repository,
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    auditService = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task and log audit', async () => {
      const createTaskDto = { title: 'Test Task', description: 'Test', category: 'Work' };
      const user = { userId: 1, organizationId: 1 };
      const task = { id: 1, ...createTaskDto, createdById: 1, organizationId: 1 };

      jest.spyOn(taskRepository, 'create').mockReturnValue(task as any);
      jest.spyOn(taskRepository, 'save').mockResolvedValue(task as any);
      jest.spyOn(auditService, 'log').mockImplementation(() => Promise.resolve());

      const result = await service.create(createTaskDto, user);

      expect(taskRepository.create).toHaveBeenCalledWith({
        ...createTaskDto,
        createdById: 1,
        organizationId: 1,
      });
      expect(taskRepository.save).toHaveBeenCalledWith(task);
      expect(auditService.log).toHaveBeenCalledWith(1, 'create', 'task', 1);
      expect(result).toEqual(task);
    });
  });

  describe('findAll', () => {
    it('should return tasks for user organization', async () => {
      const user = { userId: 1, organizationId: 1 };
      const tasks = [{ id: 1, title: 'Task 1' }];

      jest.spyOn(taskRepository, 'find').mockResolvedValue(tasks as any);

      const result = await service.findAll(user);

      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { organizationId: 1 },
        relations: ['createdBy'],
      });
      expect(result).toEqual(tasks);
    });
  });

  describe('update', () => {
    it('should update task and log audit', async () => {
      const updateTaskDto = { status: 'completed' };
      const user = { userId: 1, organizationId: 1 };
      const task = { id: 1, title: 'Task' };

      jest.spyOn(taskRepository, 'update').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(service, 'findOne').mockResolvedValue(task as any);
      jest.spyOn(auditService, 'log').mockImplementation(() => Promise.resolve());

      const result = await service.update(1, updateTaskDto, user);

      expect(taskRepository.update).toHaveBeenCalledWith({ id: 1, organizationId: 1 }, updateTaskDto);
      expect(auditService.log).toHaveBeenCalledWith(1, 'update', 'task', 1);
      expect(result).toEqual(task);
    });
  });

  describe('remove', () => {
    it('should delete task and log audit', async () => {
      const user = { userId: 1, organizationId: 1 };

      jest.spyOn(taskRepository, 'delete').mockResolvedValue({ affected: 1 } as any);
      jest.spyOn(auditService, 'log').mockImplementation(() => Promise.resolve());

      await service.remove(1, user);

      expect(taskRepository.delete).toHaveBeenCalledWith({ id: 1, organizationId: 1 });
      expect(auditService.log).toHaveBeenCalledWith(1, 'delete', 'task', 1);
    });
  });
});