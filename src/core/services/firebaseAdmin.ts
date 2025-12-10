import admin from "firebase-admin";
import { ServiceAccount } from "firebase-admin";
import { DecodedIdToken } from "firebase-admin/auth";
import config from "../config/env";
import { info, error } from "../utils/logger";
import { jwtDecode } from "jwt-decode";
import { TokenPayload } from "google-auth-library";
import axios from "axios";

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

/**
 * Verifies Facebook access token and fetches user info.
 *
 * @param {string} userAccessToken - Facebook user access token
 * @returns {Promise<{ id: string; email: string; name: string; picture: string } | null>}
 *          Returns user info if token is valid, otherwise null.
 */
export const verifyFacebookToken = async (
  userAccessToken: string
): Promise<{
  id: string;
  email: string;
  name: string;
  picture: string;
} | null> => {
  try {
    // Validate token
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${userAccessToken}&access_token=${`${config.FB_APP_ID}|${config.FB_APP_SECRET}`}`;
    const debugRes = await axios.get(debugUrl);

    if (!debugRes.data.data.is_valid) return null;

    // Get user info from Facebook
    const fields = "id,name,email,picture.type(large)";
    const userUrl = `https://graph.facebook.com/me?fields=${fields}&access_token=${userAccessToken}`;
    const userRes = await axios.get(userUrl);

    return {
      id: userRes.data.id,
      email: userRes.data.email,
      name: userRes.data.name,
      picture: userRes.data.picture.data.url,
    };
  } catch {
    console.error("Facebook token validation failed");
    return null;
  }
};
