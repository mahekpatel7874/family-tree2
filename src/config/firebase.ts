import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCzezagx0y4v1ukNd-PsWJfa556nPAZrmI",
  authDomain: "familytree-75ac6.firebaseapp.com",
  projectId: "familytree-75ac6",
  storageBucket: "familytree-75ac6.firebasestorage.app",
  messagingSenderId: "343512900088",
  appId: "1:343512900088:web:c95be5e18023b022b5f60d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;