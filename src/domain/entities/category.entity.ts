/** Catálogo: categoría de producto. Alimenta los selects del front. */
export class Category {
  private constructor(
    public readonly id: number,
    public readonly name: string
  ) {}

  public static restore(row: { id: number; name: string }): Category {
    return new Category(row.id, row.name);
  }
}
