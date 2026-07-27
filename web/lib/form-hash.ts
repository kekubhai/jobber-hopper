import { createHash } from "node:crypto";
import { canonicalFormFieldsForHash, type FormFieldLabelPayload } from "@jobber-hopper/shared";

export function sha256FormHash(fields: FormFieldLabelPayload[]): string {
  const canonical = canonicalFormFieldsForHash(fields);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
