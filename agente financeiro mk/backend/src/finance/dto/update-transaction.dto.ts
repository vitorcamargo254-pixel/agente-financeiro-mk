import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateTransactionDto {
  @IsString()
  @IsOptional()
  descricao?: string;

  @IsString()
  @IsOptional()
  codigo?: string;

  @IsString()
  @IsOptional()
  centroCusto?: string;

  @IsString()
  @IsOptional()
  ndoc?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  valor?: number;

  @IsString()
  @IsOptional()
  @IsIn(['pago', 'pendente', 'Pago', 'Pendente'])
  status?: 'pago' | 'pendente';

  @IsDateString()
  @IsOptional()
  data?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  saldo?: number;
}



