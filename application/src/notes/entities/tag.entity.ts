import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Note } from './note.entity';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tagName: string;

  @ManyToMany((type) => Note, (note) => note.tags)
  notes: Note[];
}
