import path from 'path';
import fs from 'fs';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import CreateTransactionService from './CreateTransactionService';

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const csvContent = await fs.promises.readFile(filename, {
      encoding: 'utf-8',
    });
    const transactions = csvContent.split('\n');
    transactions.splice(0, 1);
    const createTransactionService = new CreateTransactionService();
    let createdTransactions: Transaction[] = [];
    for (const transaction of transactions) {
      const [title, typeCsv, value, category] = transaction.split(',');
      const type =
        typeCsv && typeCsv.trim() === 'income' ? 'income' : 'outcome';
      if (title) {
        const createdTransaction = await createTransactionService.execute({
          title: title.trim(),
          type,
          value: parseFloat(value.trim()),
          category: category.trim(),
        });
        createdTransactions.push(createdTransaction);
      }
    }
    return createdTransactions;
  }
}

export default ImportTransactionsService;