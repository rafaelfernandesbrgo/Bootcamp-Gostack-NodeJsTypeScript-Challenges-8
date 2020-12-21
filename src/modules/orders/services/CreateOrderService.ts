import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const custumerFind = await this.customersRepository.findById(customer_id);

    if (!custumerFind) {
      throw new AppError('Could not find any customer with the giben id');
    }

    const productFind = await this.productsRepository.findAllById(products);

    if (!productFind.length) {
      throw new AppError('Could not find any product with the given ids');
    }

    const productFindIds = productFind.map(product => product.id);

    const CheckInexistentProduct = products.filter(
      product => !productFindIds.includes(product.id),
    );

    if (CheckInexistentProduct.length) {
      throw new AppError(
        `Could not find product ${CheckInexistentProduct[0].id}`,
      );
    }

    const findProductWithNoQuantityAvailabl = products.filter(
      product =>
        productFind.filter(p => p.id === product.id)[0].quantity <
        product.quantity,
    );

    if (findProductWithNoQuantityAvailabl.length) {
      throw new AppError(
        `The quantity ${findProductWithNoQuantityAvailabl[0].quantity} is not available for ${findProductWithNoQuantityAvailabl[0].id}`,
      );
    }

    const serializedProduct = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: productFind.filter(p => p.id === product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer: custumerFind,
      products: serializedProduct,
    });

    const { order_products } = order;

    const orderedProductsQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity:
        productFind.filter(p => p.id === product.product_id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(orderedProductsQuantity);

    return order;
  }
}

export default CreateOrderService;
