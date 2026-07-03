/** Usuario autenticable de la API. El hash de la clave nunca sale de la BD. */
export class User {
  private constructor(
    public readonly id: number,
    public readonly uid: string,
    public readonly username: string,
    public readonly role: string
  ) {}

  public static restore(row: { id: number; uid: string; username: string; role: string }): User {
    return new User(row.id, row.uid, row.username, row.role);
  }
}
