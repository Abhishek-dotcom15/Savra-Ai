import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, Auth, UserCredential } from 'firebase/auth';

// Lazy initialization - only initialize when needed and only on client side
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

/**
 * Get or initialize Firebase app (client-side only)
 */
function getFirebaseApp(): FirebaseApp {
  // Only initialize on client side
  if (typeof window === 'undefined') {
    throw new Error('Firebase can only be initialized on the client side');
  }

  if (app) {
    return app;
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Validate required environment variables
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    throw new Error('Firebase configuration is missing required environment variables');
  }

  // Initialize Firebase
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  return app;
}

/**
 * Get or initialize Firebase Auth (client-side only)
 */
function getFirebaseAuth(): Auth {
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth can only be used on the client side');
  }

  if (auth) {
    return auth;
  }

  const firebaseApp = getFirebaseApp();
  auth = getAuth(firebaseApp);
  return auth;
}

/**
 * Get or initialize Google Auth Provider
 */
function getGoogleProvider(): GoogleAuthProvider {
  if (typeof window === 'undefined') {
    throw new Error('Google Auth Provider can only be used on the client side');
  }

  if (googleProvider) {
    return googleProvider;
  }

  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account',
  });

  return googleProvider;
}

/**
 * Sign in with Google
 * @returns Promise with user credential containing ID token
 */
export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const authInstance = getFirebaseAuth();
    const provider = getGoogleProvider();
    const result = await signInWithPopup(authInstance, provider);
    return result;
  } catch (error: any) {
    // Handle user cancellation gracefully
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

/**
 * Get the ID token from the current user
 * @returns Promise with ID token string
 */
export const getIdToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const authInstance = getFirebaseAuth();
    const user = authInstance.currentUser;
    if (!user) {
      return null;
    }
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

// Export auth getter for backward compatibility (but it will only work on client side)
export const getAuthInstance = (): Auth => {
  return getFirebaseAuth();
};
