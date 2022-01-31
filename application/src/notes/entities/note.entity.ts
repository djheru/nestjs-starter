import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tag } from './tag.entity';
import { Todo } from './todo.entity';

@Entity()
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  details?: string;

  @ManyToMany((type) => Tag, (tags) => tags.notes, {
    cascade: ['insert', 'update'],
    eager: true,
  })
  @JoinTable()
  tags?: Tag[];

  @OneToMany(() => Todo, (todos) => todos.note, {
    cascade: ['insert', 'update', 'soft-remove', 'recover'],
    eager: true,
  })
  @JoinTable()
  todos?: Todo[];

  @CreateDateColumn()
  createdDate: Date;

  @UpdateDateColumn()
  updatedDate: Date;

  @DeleteDateColumn()
  deletedDate: Date;
}
