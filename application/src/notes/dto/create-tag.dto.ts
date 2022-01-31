import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ description: 'The tag name' })
  @IsString()
  readonly tagName: string;
}
