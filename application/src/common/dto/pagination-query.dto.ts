// import { Type } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @IsPositive()
  // @Type(() => Number) // Unneeded b/c of ValidationPipe option transformOptions.enableImplicitConversion
  skip: number;

  @IsOptional()
  @IsPositive()
  // @Type(() => Number) // Unneeded b/c of ValidationPipe option transformOptions.enableImplicitConversion
  take: number;
}
