import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { DocumentOptions } from "firebase-functions/firestore";

export const functionOpts: Pick<DocumentOptions, "region"> = {
  region: "northamerica-northeast2",
};

initializeApp();
export const db = getFirestore();
