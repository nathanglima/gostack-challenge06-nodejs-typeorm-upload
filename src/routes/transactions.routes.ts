import { Router } from 'express';
import multer from 'multer';
import { getCustomRepository, getRepository, Repository } from 'typeorm';

import uploadConfig from '../config/upload';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CreateTransactionService from '../services/CreateTransactionService';
import DeleteTransactionService from '../services/DeleteTransactionService';
import ImportTransactionsService from '../services/ImportTransactionsService';

const transactionsRouter = Router();
const upload = multer(uploadConfig);

transactionsRouter.get('/', async (request, response) => {

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactions = await transactionsRepository.find();
    const balance = await transactionsRepository.getBalance();
    
    console.log(transactions);

    return response.json({ transactions, balance });
});

transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({ title, value, type, category });

  return response.json(transaction);

});

transactionsRouter.delete('/:id', async (request, response) => {
  const id = request.params.id;

  const deleteTransaction = new DeleteTransactionService();

  const transaction = await deleteTransaction.execute({id});

  return response.json(transaction);
});

transactionsRouter.post('/import', upload.single('file'), async (request, response) => {
  const { path: filePath } = request.file;

  const importTransactions = new ImportTransactionsService();

  const transactions = await importTransactions.execute(filePath);

  return response.json(transactions);
});

export default transactionsRouter;
