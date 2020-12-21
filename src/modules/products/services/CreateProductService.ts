import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    const productFind = await this.productsRepository.findByName(name);

    if (productFind) {
      throw new AppError('Ther is already one product with this name');
    }

    const customers = await this.productsRepository.create({
      name,
      price,
      quantity,
    });
    return customers;
  }
}

export default CreateProductService;
