import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";
import config from "../config/env";
import { info, error } from "../utils/logger";

let firebaseInitialized = false;

/**
 * Initializes Firebase Admin SDK with service account credentials
 */
export const initializeFirebaseAdmin = (): void => {
  if (firebaseInitialized) {
    return;
  }

  try {
    const serviceAccount: ServiceAccount = {
      projectId: config.FIREBASE_PROJECT_ID,
      privateKey: config.FIREBASE_PRIVATE_KEY,
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    firebaseInitialized = true;
    info(
      "Firebase Admin SDK initialized successfully",
      {},
      { source: "firebase.init" }
    );
  } catch (err) {
    error(
      "Failed to initialize Firebase Admin SDK",
      { error: err instanceof Error ? err.message : "Unknown error" },
      { source: "firebase.init" }
    );
    throw err;
  }
};

/**
 * Verifies a Firebase ID token from the client
 * @param idToken - The Firebase ID token from the client
 * @returns Decoded token with user information
 */
export const verifyFirebaseToken = async (
  idToken: string
): Promise<DecodedIdToken> => {
  if (!firebaseInitialized) {
    initializeFirebaseAdmin(); // ✅ Ensure it’s initialized
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (err) {
    error(
      "Firebase token verification failed",
      { error: err instanceof Error ? err.message : "Unknown error" },
      { source: "firebase.verifyToken" }
    );
    throw new Error("Invalid or expired Firebase token");
  }
};

export default admin;
