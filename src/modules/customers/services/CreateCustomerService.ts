import AppError from '@shared/errors/AppError';
import { inject, injectable } from 'tsyringe';
import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const customerFind = await this.customersRepository.findByEmail(email);

    if (customerFind) {
      throw new AppError('this email is already assigned to a customer');
    }

    const customers = this.customersRepository.create({
      name,
      email,
    });
    return customers;
  }
}

export default CreateCustomerService;
