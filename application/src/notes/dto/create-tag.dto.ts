import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ description: 'The tag id' })
  @IsOptional()
  @IsString()
  readonly id?: string;

  @ApiProperty({ description: 'The tag name' })
  @IsString()
  readonly tagName: string;
}
