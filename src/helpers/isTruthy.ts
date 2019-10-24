export function isTruthy<T>(
  value: NonNullable<T> | false | null | undefined | '' | 0
): value is NonNullable<T> {
  // tslint:disable-next-line
  return !!value;
}
