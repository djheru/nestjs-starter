import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateTodoDto {
  @ApiProperty({ description: 'The todo text' })
  @IsString()
  readonly text: string;

  @ApiProperty({ description: 'The completion status of the todo' })
  @IsBoolean()
  readonly isCompleted: boolean;

  @ApiProperty({ description: 'The todo due date' })
  @IsOptional()
  @IsDateString()
  readonly dueDate?: string;
}
