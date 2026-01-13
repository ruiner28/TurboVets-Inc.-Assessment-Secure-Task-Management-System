import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from '../data';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Permissions, Roles } from '../auth-lib';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @Permissions('create:task')
  create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.taskService.create(createTaskDto, req.user);
  }

  @Get()
  @Permissions('read:task')
  findAll(@Request() req) {
    return this.taskService.findAll(req.user);
  }

  @Get(':id')
  @Permissions('read:task')
  findOne(@Param('id') id: string, @Request() req) {
    return this.taskService.findOne(+id, req.user);
  }

  @Patch(':id')
  @Permissions('update:task')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto, @Request() req) {
    return this.taskService.update(+id, updateTaskDto, req.user);
  }

  @Delete(':id')
  @Permissions('delete:task')
  remove(@Param('id') id: string, @Request() req) {
    return this.taskService.remove(+id, req.user);
  }

  @Get('audit-log')
  @Permissions('read:audit')
  getAuditLogs() {
    return this.taskService.getAuditLogs();
  }
}
