/** A help function for listing lines to be joined. */
export function lines(...lines: string[]): string {
  return lines.join("\n");
}

export function comment(...lines: string[]): string {
  const starred = lines.map((x) => ` * ${x}`);
  const bookended = ["/**", ...starred, " **/"];
  return bookended.join("\n");
}
