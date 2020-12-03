<img alt="GoStack" src="https://camo.githubusercontent.com/a869a2aaab296ef925343d7e76518cd213eb0a30/68747470733a2f2f73746f726167652e676f6f676c65617069732e636f6d2f676f6c64656e2d77696e642f626f6f7463616d702d676f737461636b2f6865616465722d6465736166696f732d6e65772e706e67" />

<h2 align="center">
  Challenge 06: NodeJS TypeORM File Upload
</h2>


## :page_facing_up: About this challenge

This challenge, we were challenged to develop the logic of a file upload application using NodeJS, TypeORM, TypeScript and PostgreSQL.

It was necessary to create migrations of the database structure for PostgreSQL (tables and relationships), make the relationship of the entities into the models and develop the business rules.

## :rocket: About of tests
Some rules for evaluating this challenge were proposed, some tests were written using jest and to pass the tests it is necessary to respect all the points below:

---

#### *should be able to create a new transaction*
In order for this test to pass, your application must allow a transaction be created and return a json with the transaction created.

#### transactions.routes.ts
```js
transactionsRouter.post('/', async (request, response) => {
  const { title, value, type, category } = request.body;

  const createTransaction = new CreateTransactionService();

  const transaction = await createTransaction.execute({ title, value, type, category });

  return response.json(transaction);

});
```

#### CreateTransactionService.ts

```js
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
```
---

#### *should create tags when inserting new transactions*
In order for this test to pass, your application must allow when create a new transaction with a category that does not exists, same be created and insert in field category_id of transaction with id that has just been created.

#### *should not create tags when they already exists*
In order for this test to pass, your application must allow when create a new transaction with a category that do exists, be assigned into field category_id of transaction with this id of category already existing, do not allowing the creation of categories with the same title.

```js
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
```

---

#### *should be able to list the transactions*
In order for this test to pass, your application must allow be returned a array of objects containing all transactions together with income balance, outcome and total of transacions that went created until now.

#### transactions.routes.ts

```js
transactionsRouter.get('/', async (request, response) => {

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transactions = await transactionsRepository.find();
    const balance = await transactionsRepository.getBalance();
    
    return response.json({ transactions, balance });
});
```

#### TransactionsRepository.ts

```js
public async getBalance(): Promise<Balance> {
  const transactions = await this.find();

  const balance = transactions.reduce(
    (accumulator, transaction) => {
      switch (transaction.type) {
        case 'income':
          accumulator.income += Number(transaction.value);
          break;

        case 'outcome':
          accumulator.outcome += Number(transaction.value);
          break;

        default:
          break;
      }

      return accumulator;
    },
    {
      income: 0,
      outcome: 0,
      total: 0,
    },
  );

  balance.total = balance.income - balance.outcome;

  return balance;
}
```

---

#### *should not be able to create outcome transaction without a valid balance*
In order for this test to pass, your application do not must allow when a transaction of type outcome exceed the total value that the user has in cash (income total), returning a response with HTTP 400 status code and a message of error following format: { error: string }.

```js
if (type === 'outcome' && total < value)
  throw new AppError('Transaction not permitted, insufficient funds', 400);
```

---

#### *should be able to delete a transaction*
In order for this test to pass, you have must allow when your exclusion route, delete a transaction, and when deleting, return an empty response with status code 204.

#### transactions.routes.ts

```js
transactionsRouter.delete('/:id', async (request, response) => {
  const id = request.params.id;

  const deleteTransaction = new DeleteTransactionService();

  const transaction = await deleteTransaction.execute({id});

  return response.json(transaction);
});
```

#### DeleteTransactionService.ts

```js
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
```

---

#### *should be able to import transactions*
In order for this test to pass, your application must allow it to be imported a CSV file,
containing thw following model. With the file imported, you must allow it to be created on database all registries and categories that were present in the file,
and returning all transactions that went imported.

#### transactions.routes.ts

```js
transactionsRouter.post('/import', upload.single('file'), async (request, response) => {
  const { path: filePath } = request.file;

  const importTransactions = new ImportTransactionsService();

  const transactions = await importTransactions.execute(filePath);

  return response.json(transactions);
});
```

#### ImportTransactionsService.ts

```js
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
```
