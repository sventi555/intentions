import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { CallableOptions } from "firebase-functions/https";

export const functionOpts: Pick<CallableOptions, "region"> = {
  region: "northamerica-northeast2",
};

initializeApp();
export const db = getFirestore();
export const auth = getAuth();
