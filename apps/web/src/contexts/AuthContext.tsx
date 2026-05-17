import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@veglia/firebase-config";
import type { CustomClaims, VegliaUser } from "@veglia/shared";

interface AuthState {
  firebaseUser: User | null;
  vegliaUser: VegliaUser | null;
  claims: CustomClaims | null;
  loading: boolean;
}

interface AuthActions {
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<(AuthState & AuthActions) | null>(null);

const googleProvider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    vegliaUser: null,
    claims: null,
    loading: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ firebaseUser: null, vegliaUser: null, claims: null, loading: false });
        return;
      }

      // Busca custom claims do token
      const tokenResult = await user.getIdTokenResult();
      const claims = tokenResult.claims as Partial<CustomClaims>;

      let vegliaUser: VegliaUser | null = null;
      if (claims.company_id) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) vegliaUser = snap.data() as VegliaUser;
      }

      setState({
        firebaseUser: user,
        vegliaUser,
        claims: claims.company_id ? (claims as CustomClaims) : null,
        loading: false,
      });
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ ...state, loginWithEmail, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
