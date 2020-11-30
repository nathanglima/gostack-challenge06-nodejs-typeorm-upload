import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import { getRepository } from 'typeorm';

interface Request {
  id: string
}

class DeleteTransactionService {
  public async execute({ id }: Request ): Promise<void> {
  
    const transactionRepository = getRepository(Transaction);

    let transaction = transactionRepository.findOne({
      where: { id: id  }
    });

    if(transaction) {
      await transactionRepository.delete(id);
      throw new AppError('', 204);
    }    
  }
}

export default DeleteTransactionService;
