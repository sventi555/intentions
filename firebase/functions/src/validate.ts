import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { z, ZodType } from "zod";

export const parseValidatedData = <T extends ZodType>(
  req: CallableRequest,
  schema: T,
): z.infer<T> => {
  const parseRes = schema.safeParse(req.data);
  if (!parseRes.success) {
    throw new HttpsError(
      "invalid-argument",
      "Validation error.",
      parseRes.error.issues,
    );
  }
  return parseRes.data;
};
