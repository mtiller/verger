/**
 * This function checks if a given string is a valid Javascript identifier.
 * It turns out that there are other valid identifiers that will
 * fail this test (strings with unicode in them).  But if it passes this test
 * it is belongs to a legal subset of possible legal identifiers.
 **/
const idRegExp = /^[$A-Z_][0-9A-Z_$]*$/i;
export function validName(n: string): boolean {
  return idRegExp.test(n);
}
export function validType(n: string): boolean {
  if (n[0].toLowerCase() === n[0]) return false;
  return validName(n);
}
