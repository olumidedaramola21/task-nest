import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './tasks.entity';
import { TaskStatus } from './task-status.enum';
import { Repository } from 'typeorm';
import { User } from 'src/auth/user.entity';

@Injectable()
export class TasksService {
  private logger = new Logger('TaskService');

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    try {
      const { status, search } = filterDto;
      const query = this.tasksRepository.createQueryBuilder('task');

      query.where('task.userId = :userId', { userId: user.id });

      if (status) {
        query.andWhere('task.status = :status', { status });
      }

      if (search) {
        query.andWhere(
          '( LOWER(task.title) LIKE LOWER(:search) or  LOWER(task.description) LIKE LOWER(:search) )',
          { search: `%${search}%` },
        );
      }
      const tasks = await query.getMany();

      return tasks;
    } catch (error) {
      this.logger.error(
        `Failed to get tasks for user "${user.username}". Filters: ${JSON.stringify(filterDto)}, `,
        error.stack,
      );
      throw error;
    }
  }

  async getTaskById(id: string, user: User): Promise<Task> {
    const found = await this.tasksRepository.findOne({ where: { id, user } });

    if (!found) {
      this.logger.warn(
        `Tasks with ID "${id}" not found for user "${user.username}"`,
      );
      throw new NotFoundException(`Tasks with ID "${id}" not found`);
    }
    return found;
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;

    const task = this.tasksRepository.create({
      title,
      description,
      status: TaskStatus.OPEN,
      user,
    });

    await this.tasksRepository.save(task);

    this.logger.verbose(
      `User "${user.username}" created a new task. Data: ${JSON.stringify(task)}`,
    );

    return task;
  }

  async updateTaskStatus(
    id: string,
    status: TaskStatus,
    user: User,
  ): Promise<Task> {
    const task = await this.getTaskById(id, user);
    task.status = status;
    await this.tasksRepository.save(task);

    this.logger.verbose(
      `User "${user.username}" updated task ${id} status to ${task.status}.`,
    );

    return task;
  }

  async deleteTask(id: string, user: User): Promise<void> {
    const result = await this.tasksRepository.delete({ id, user });

    if (result.affected === 0) {
      this.logger.warn(
        `User "${user.username}" tried to delete task ${id} but it was not found`,
      );
      throw new NotFoundException(`Tasks with ID "${id}" not found`);
    }

    this.logger.verbose(
      `User "${user.username}" deleted task ${id} successfully`,
    );
  }
}
