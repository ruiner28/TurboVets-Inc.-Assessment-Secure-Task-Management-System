import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity()
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  parentId: number;

  @OneToMany(() => User, user => user.organization)
  users: User[];

  @OneToMany(() => Task, task => task.organization)
  tasks: Task[];
}
