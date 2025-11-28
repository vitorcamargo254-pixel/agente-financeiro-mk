import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  centroCusto: string;

  @IsString()
  @IsOptional()
  ndoc?: string;

  @IsNumber()
  @Type(() => Number)
  valor: number;

  @IsString()
  @IsIn(['pago', 'pendente', 'Pago', 'Pendente'])
  status: 'pago' | 'pendente';

  @IsDateString()
  data: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  saldo?: number;
}



