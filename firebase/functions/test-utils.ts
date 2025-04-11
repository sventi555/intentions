import { ParamsOf } from "firebase-functions";
import functionsTest from "firebase-functions-test";
import { db } from "./src/app";

const test = functionsTest();

export const wrap = test.wrap;

const replaceParams = <T extends string>(docPath: T, params: ParamsOf<T>) => {
  return Object.entries(params).reduce<string>((acc, [paramKey, paramVal]) => {
    return acc.replace(`{${paramKey}}`, paramVal);
  }, docPath);
};

export const makeSnap = <T extends string>(
  documentPath: T,
  params: ParamsOf<T>,
  data: any,
) => {
  const snap = test.firestore.makeDocumentSnapshot(
    data,
    replaceParams(documentPath, params),
  );
  return { data: snap, params };
};

export const makeChangeSnap = <T extends string>(
  documentPath: T,
  params: ParamsOf<T>,
  before: any,
  after: any,
) => {
  const docPath = replaceParams(documentPath, params);
  const beforeSnap = test.firestore.makeDocumentSnapshot(before, docPath);
  const afterSnap = test.firestore.makeDocumentSnapshot(after, docPath);

  return { data: test.makeChange(beforeSnap, afterSnap), params };
};

export const clearDatabase = async () => {
  const collections = await db.listCollections();
  const deletePromises = collections.map((c) => db.recursiveDelete(c));

  await Promise.all(deletePromises);
};
