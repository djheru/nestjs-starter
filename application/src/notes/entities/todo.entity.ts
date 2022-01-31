import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Note } from './note.entity';

@Entity()
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  text: string;

  @Column('boolean')
  isCompleted: boolean;

  @Column({ nullable: true })
  dueDate?: string;

  @ManyToOne((type) => Note, (note) => note.todos)
  note: Note;
}
