import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
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
    cascade: true,
  })
  @JoinTable()
  tags?: Tag[];

  @OneToMany(() => Todo, (todos) => todos.note, {
    cascade: true,
  })
  @JoinTable()
  todos?: Todo[];
}
