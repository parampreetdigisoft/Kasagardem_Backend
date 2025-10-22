//Project Config types
export interface Config {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  MONGODB_NAME: string;
  JWT_SECRET: string;
  JWT_EXPIRE: string;
  APPDEV_URL: string;
  KASAGARDEM_PLANTAPI_KEY: string;
  KASAGARDEM_PLANTAPI_URL: string;
  KASAGARDEM_PLANTAPI_KEY_NAME: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  AWS_S3_BUCKET: string;
  EMAIL_USER: string;
  EMAIL_PASS: string;
  EMAIL_FROM: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_PRIVATE_KEY_ID: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_CLIENT_EMAIL: string;
}
