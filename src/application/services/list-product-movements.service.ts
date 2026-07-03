import { inject, injectable } from 'inversify';
import { TYPES } from '../../container/types';
import { InventoryMovement } from '../../domain/entities/inventory-movement.entity';
import { IInventoryMovementRepository } from '../../domain/ports/inventory-movement.repository';
import { IProductRepository } from '../../domain/ports/product.repository';
import { FindProductByUidUseCase } from '../use-cases/find-product-by-uid.use-case';
import { ListMovementsByProductUseCase } from '../use-cases/list-movements-by-product.use-case';

/** Servicio de aplicación (RF-02): dos casos de uso de lectura, sin transacción. */
@injectable()
export class ListProductMovementsService {
  private readonly findProduct: FindProductByUidUseCase;
  private readonly listMovements: ListMovementsByProductUseCase;

  constructor(
    @inject(TYPES.ProductRepository) products: IProductRepository,
    @inject(TYPES.MovementRepository) movements: IInventoryMovementRepository
  ) {
    this.findProduct = new FindProductByUidUseCase(products);
    this.listMovements = new ListMovementsByProductUseCase(movements);
  }

  public async execute(productUid: string): Promise<InventoryMovement[]> {
    const product = await this.findProduct.execute(productUid);
    return this.listMovements.execute(product.id);
  }
}
