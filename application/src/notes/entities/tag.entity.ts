import { paramCase } from 'change-case';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Note } from './note.entity';

@Entity()
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  tagName: string;

  @ManyToMany((type) => Note, (note) => note.tags)
  notes: Note[];

  @BeforeInsert()
  @BeforeUpdate()
  normalizeTag() {
    this.tagName = paramCase(this.tagName);
  }
}
