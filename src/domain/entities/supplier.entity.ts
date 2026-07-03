/** Catálogo: proveedor. Alimenta los selects del front. */
export class Supplier {
  private constructor(
    public readonly id: number,
    public readonly name: string
  ) {}

  public static restore(row: { id: number; name: string }): Supplier {
    return new Supplier(row.id, row.name);
  }
}
