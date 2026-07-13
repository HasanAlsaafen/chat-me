export function getId(
  obj: { id?: string; _id?: string } | string | null | undefined,
): string {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  return obj.id ?? obj._id ?? "";
}
