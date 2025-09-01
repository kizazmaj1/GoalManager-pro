

// FIX: Switched to Firebase compat imports for app and auth to resolve "no exported member" errors. Firestore remains on the modular v9 API.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
// FIX: Import FirebaseOptions type from 'firebase/firestore' to resolve namespace error.
import { getFirestore, type Firestore, type FirebaseOptions } from 'firebase/firestore';

// FIX: Replaced reliance on global window variables for Firebase config with environment variables for better security and standard practice. This resolves the "Firebase config not found" error when `window.__firebase_config` is not injected.
const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

export interface FirebaseServices {
    app: firebase.app.App;
    db: Firestore;
    auth: firebase.auth.Auth;
}

export let isDemoMode = false;

let services: FirebaseServices | null = null;
let initializationPromise: Promise<FirebaseServices | null> | null = null;

export function getFirebaseServices(): Promise<FirebaseServices | null> {
    if (services) {
        return Promise.resolve(services);
    }

    if (initializationPromise) {
        return initializationPromise;
    }
    
    initializationPromise = (async () => {
        if (!firebaseConfig.projectId) {
            console.log("Firebase config not found in environment variables. Enabling Demo Mode.");
            isDemoMode = true;
            return null;
        }

        try {
            const app = firebase.initializeApp(firebaseConfig);
            const db = getFirestore(app);
            const auth = firebase.auth(app);
            
            services = { app, db, auth };
            return services;
        } catch (error) {
            console.error("Failed to initialize Firebase from config:", error);
            console.log("Enabling Demo Mode.");
            isDemoMode = true;
            return null;
        }
    })();

    return initializationPromise;
}

// FIX: Switched from global window variables to environment variables for appId and initialAuthToken for consistency.
export const appId = process.env.APP_ID || 'default-app-id';
export const initialAuthToken = process.env.INITIAL_AUTH_TOKEN || null;

export const bookingsCollectionPath = `artifacts/${appId}/public/data/bookings`;