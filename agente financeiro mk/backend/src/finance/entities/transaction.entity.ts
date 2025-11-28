export interface TransactionEntity {
  id?: number;
  descricao: string;
  codigo: string;
  centroCusto: string;
  ndoc?: string;
  valor: number;
  status: 'pago' | 'pendente';
  data: Date;
  saldo?: number;
  createdAt?: Date;
  updatedAt?: Date;
}




