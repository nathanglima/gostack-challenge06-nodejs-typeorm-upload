// import AppError from '../errors/AppError';
import { getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({ title, value, type, category }: Request ): Promise<Transaction> {

    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionRepository.getBalance();

    if (type === 'outcome' && total < value)
      throw new AppError('Transaction not permitted, insufficient funds');

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category
      }
    });

    if(!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category
      });
      await categoryRepository.save(transactionCategory);
    }

    const transaction = transactionRepository.create({
      title, value, type, category_id: transactionCategory?.id
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
