import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateTagDto } from './create-tag.dto';
import { CreateTodoDto } from './create-todo.dto';

export class CreateNoteDto {
  @ApiProperty({ description: 'The note title' })
  @IsString()
  readonly title: string;

  @ApiProperty({ description: 'The note description/summary' })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiProperty({ description: 'The note details' })
  @IsOptional()
  @IsString()
  readonly details?: string;

  @ApiProperty({ description: 'The categorization tags for the note' })
  @IsOptional()
  @Type(() => CreateTagDto)
  @ValidateNested({ each: true })
  readonly tags?: CreateTagDto[];

  @ApiProperty({ description: 'To-do items associated with the note' })
  @IsOptional()
  @Type(() => CreateTodoDto)
  @ValidateNested({ each: true })
  readonly todos?: CreateTodoDto[];

  @ApiProperty({ description: 'Date entity was created' })
  @IsOptional()
  createdDate?: Date;

  @ApiProperty({ description: 'Date entity was updated' })
  @IsOptional()
  updatedDate?: Date;

  @ApiProperty({ description: 'Date entity was deleted' })
  @IsOptional()
  deletedDate?: Date;
}
