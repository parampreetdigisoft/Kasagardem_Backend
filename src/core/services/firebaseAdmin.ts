import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";
import config from "../config/env";
import { info, error } from "../utils/logger";
import { jwtDecode } from "jwt-decode";
import { TokenPayload } from "google-auth-library";

let firebaseInitialized = false;

/**
 * Initializes Firebase Admin SDK with service account credentials.
 *
 * @returns {void}
 */
export const initializeFirebaseAdmin = (): void => {
  if (firebaseInitialized) return;

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
    info("Firebase Admin initialized", {}, { source: "firebase.init" });
  } catch (err) {
    error(
      "Firebase Admin initialization failed",
      { error: err instanceof Error ? err.message : err },
      { source: "firebase.init" }
    );
    throw err;
  }
};

/**
 * Decodes a Google ID token WITHOUT verifying audience or signature.
 *
 * @param idToken Google OAuth ID Token
 * @returns Decoded payload (unsafe decode)
 */
export const decodeGoogleIdToken = (idToken: string): TokenPayload | null => {
  try {
    const payload = jwtDecode<TokenPayload>(idToken);
    return payload ?? null;
  } catch (err) {
    console.error("Failed to decode Google token", err);
    return null;
  }
};

/**
 * Verifies a Firebase token with full security checks.
 *
 * @param idToken Firebase ID token
 * @returns Fully verified Firebase token
 */
export const verifyFirebaseToken = async (
  idToken: string
): Promise<DecodedIdToken> => {
  try {
    if (!firebaseInitialized) initializeFirebaseAdmin();

    return await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    error(
      "Firebase token verification failed",
      { error: err instanceof Error ? err.message : "Unknown error" },
      { source: "firebase.verify" }
    );
    throw new Error("Invalid or expired Firebase token");
  }
};

export default admin;
