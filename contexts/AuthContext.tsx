import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  Auth,
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, limit, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { initializeUserPortfolio } from '../lib/portfolioUtils';
import { autoMigrateOnLogin } from '../lib/migrateWalletsToPortfolio';
import { diagnoseComplete } from '../lib/diagnosticPortfolio';
import { generateBankAccountByCountry } from '../lib/bankAccountGenerator';
import { formatPhoneForPix } from '../lib/pixPhoneUtils';

interface UserData {
  uid: string;
  email: string;
  name: string;
  phone: string;
  country: string;
  accountPin: string;
  createdAt: Date;
  photoURL?: string; // URL da foto do perfil
  // Campos adicionais do perfil (opcionais inicialmente)
  birthDate?: string;
  documentType?: 'cpf' | 'cnpj' | 'passport';
  document?: string; // CPF, CNPJ, Passaporte
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  patrimony?: string;
  accountPurpose?: string[];
  profileCompleted?: boolean;
  profileCompletedAt?: Date;
  // ✅ NOVO: Preferências do usuário
  language?: 'pt-BR' | 'en-US' | 'es';
  preferences?: {
    visibleCards?: string[];
    dismissedAlerts?: string[];
  };
  // ✅ NOVO: Sistema de aprovação de conta
  aprovado?: 'yes' | 'no';
  trackLocationEnabled?: boolean;
  requireCameraPermission?: boolean;
  permissionsRequested?: boolean;
  permissionsRequestedAt?: string;
  locationPermission?: string;
  cameraPermission?: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAuthenticated: boolean;
  isPinVerified: boolean;
  auth: Auth;
  signUp: (email: string, password: string, name: string, phone: string, country: string, accountPin: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithPhoneAndPin: (phone: string, pin: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  setPinVerified: (verified: boolean) => void;
  checkIfUserHasPin: () => Promise<boolean>;
  checkPhoneExists: (phone: string) => Promise<boolean>;
  reloadUserData: () => Promise<void>;
  updateLanguage: (language: 'pt-BR' | 'en-US' | 'es') => Promise<void>;
  updateVisibleCards: (cards: string[]) => Promise<void>;
  dismissAlert: (alertId: string) => Promise<void>;
  syncPixKeys: (userId: string, newEmail?: string, newPhone?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isAuthenticated: false,
  isPinVerified: false,
  auth: auth,
  signUp: async () => { },
  signIn: async () => { },
  signInWithPhoneAndPin: async () => { },
  signInWithGoogle: async () => { },
  logout: async () => { },
  verifyPin: async () => false,
  setPinVerified: () => { },
  checkIfUserHasPin: async () => false,
  checkPhoneExists: async () => false,
  reloadUserData: async () => { },
  updateLanguage: async () => { },
  updateVisibleCards: async () => { },
  dismissAlert: async () => { },
  syncPixKeys: async () => { },
});

export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPinVerified, setIsPinVerified] = useState(false);

  // ✅ REFS PARA DETECTAR MUDANÇAS NO PERFIL
  const previousEmail = useRef<string>('');
  const previousPhone = useRef<string>('');

  // ✅ CHAVE PARA PERSISTÊNCIA DO PIN VERIFICADO
  const PIN_VERIFIED_KEY = 'NexCoin_pin_verified';

  // ✅ FUNÇÃO PARA SALVAR ESTADO DE PIN VERIFICADO COM PERSISTÊNCIA
  const setPinVerifiedWithPersistence = (verified: boolean) => {
    setIsPinVerified(verified);

    if (verified && user?.uid) {
      // Salvar UID do usuário no localStorage quando PIN for verificado
      localStorage.setItem(PIN_VERIFIED_KEY, user.uid);
      console.log('✅ Estado de PIN verificado salvo no localStorage');
    } else {
      // Remover do localStorage quando desmarcar
      localStorage.removeItem(PIN_VERIFIED_KEY);
      console.log('🗑️ Estado de PIN verificado removido do localStorage');
    }
  };

  // ✅ FUNÇÃO PARA VERIFICAR SE PIN FOI VERIFICADO ANTERIORMENTE
  const checkPinVerifiedFromStorage = (userId: string): boolean => {
    const storedUserId = localStorage.getItem(PIN_VERIFIED_KEY);
    const isVerified = storedUserId === userId;
    console.log('🔍 Verificando PIN do localStorage:', isVerified ? 'Verificado' : 'Não verificado');
    return isVerified;
  };

  // ⚠️ FUNÇÃO AUXILIAR: Normalizar telefone (remover formatação)
  // Garante que o telefone seja salvo sempre no formato: +5511999999999
  const normalizePhone = (phone: string): string => {
    // Remove tudo que não é número
    const numbersOnly = phone.replace(/\D/g, '');

    // Se já começar com +, retornar como está (apenas números)
    if (phone.startsWith('+')) {
      return `+${numbersOnly}`;
    }

    // Se não começar com +, adicionar
    return `+${numbersOnly}`;
  };

  // Função auxiliar para gerar senha baseada em telefone e PIN
  // NOTA: mantemos dois salts por causa do rebranding (compatibilidade retroativa)
  const generatePasswordFromPhoneAndPin = (phone: string, pin: string): string => {
    const salt = 'Ethertron2024!';
    return `${phone}_${pin}_${salt}`;
  };

  // Salt alternativo (usado após rebranding - pode existir em contas recentes)
  const generatePasswordFromPhoneAndPinAlt = (phone: string, pin: string): string => {
    const salt = 'NexCoin2024!';
    return `${phone}_${pin}_${salt}`;
  };

  // Carregar dados do usuário do Firestore
  const loadUserData = async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data() as UserData;
        setUserData(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      return null;
    }
  };

  // Recarregar dados do usuário do Firestore
  const reloadUserData = async () => {
    if (user) {
      const userData = await loadUserData(user.uid);
      setUserData(userData);
    }
  };

  // ✅ CRIAR CHAVES PIX AUTOMÁTICAS PARA USUÁRIOS BRASILEIROS (IDEMPOTENTE)
  const createAutoPixKeys = async (userId: string, userEmail: string, userPhone: string) => {
    try {
      console.log('🔑 Sincronizando chaves PIX automáticas (Idempotente)...');

      // 1️⃣ GARANTIR CONTA BANCÁRIA BRL ÚNICA
      const accountId = `${userId}_BRL`;
      const accountDocRef = doc(db, 'bankAccounts', accountId);
      const accountSnapshot = await getDoc(accountDocRef);

      let accountNumber = '';

      if (!accountSnapshot.exists()) {
        console.log('💼 Criando conta bancária BRL única...');
        const newAccount = generateBankAccountByCountry('BR', userId);
        accountNumber = newAccount.accountNumber;

        await setDoc(accountDocRef, {
          ...newAccount,
          id: accountId, // ID fixo para evitar duplicatas
          userId: userId,
          isPrimary: true,
          createdAt: new Date(),
        });
        console.log('✅ Conta BRL criada com ID fixo:', accountId);
      } else {
        accountNumber = accountSnapshot.data().accountNumber;
        console.log('✅ Conta BRL já existe:', accountId);
      }

      // 2️⃣ GARANTIR CHAVES PIX ÚNICAS
      // Chave de EMAIL
      const emailKeyId = `${userId}_pix_email`;
      const emailKeyDocRef = doc(db, 'pixKeys', emailKeyId);
      await setDoc(emailKeyDocRef, {
        id: emailKeyId,
        userId: userId,
        accountId: accountId,
        accountNumber: accountNumber,
        currency: 'BRL',
        country: 'BR',
        keyType: 'email',
        keyValue: userEmail,
        createdAt: new Date(),
      }, { merge: true });

      // Chave de TELEFONE
      const pixPhone = formatPhoneForPix(userPhone);
      const phoneKeyId = `${userId}_pix_phone`;
      const phoneKeyDocRef = doc(db, 'pixKeys', phoneKeyId);
      await setDoc(phoneKeyDocRef, {
        id: phoneKeyId,
        userId: userId,
        accountId: accountId,
        accountNumber: accountNumber,
        currency: 'BRL',
        country: 'BR',
        keyType: 'phone',
        keyValue: pixPhone,
        createdAt: new Date(),
      }, { merge: true });

      console.log('✅ Chaves PIX sincronizadas com sucesso');
    } catch (error) {
      console.error('❌ Erro na sincronização de chaves PIX:', error);
    }
  };

  // ✅ SINCRONIZAR CHAVES PIX QUANDO EMAIL OU TELEFONE MUDAM
  const syncPixKeys = async (userId: string, newEmail?: string, newPhone?: string) => {
    try {
      console.log('🔄 Sincronizando chaves PIX com novos dados do perfil...');

      const pixKeysRef = collection(db, 'pixKeys');
      const q = query(pixKeysRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('ℹ️ Nenhuma chave PIX encontrada para sincronizar');
        return;
      }

      const updatePromises: Promise<void>[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const pixKeyRef = doc(db, 'pixKeys', docSnap.id);

        if (data.keyType === 'email' && newEmail) {
          updatePromises.push(updateDoc(pixKeyRef, { keyValue: newEmail }) as Promise<void>);
        }

        if (data.keyType === 'phone' && newPhone) {
          updatePromises.push(updateDoc(pixKeyRef, { keyValue: newPhone }) as Promise<void>);
        }
      });

      await Promise.all(updatePromises);
      console.log('✅ Chaves PIX sincronizadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao sincronizar chaves PIX:', error);
    }
  };

  // Cadastro
  const signUp = async (
    email: string,
    password: string,
    name: string,
    phone: string,
    country: string,
    accountPin: string
  ) => {
    try {
      const normalizedPhone = normalizePhone(phone);

      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', normalizedPhone), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error('Este número de telefone já está cadastrado');
      }

      const generatedPassword = generatePasswordFromPhoneAndPin(normalizedPhone, accountPin);
      const userCredential = await createUserWithEmailAndPassword(auth, email, generatedPassword);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userData: UserData = {
        uid: user.uid,
        email: user.email || email,
        name,
        phone: normalizedPhone,
        country,
        accountPin,
        createdAt: new Date(),
        aprovado: 'no',
      };

      await setDoc(userDocRef, userData);
      setUserData(userData);

      // ── Criar conta bancária automaticamente com base no país ──────────────
      try {
        // Determinar país: usa o país selecionado no cadastro,
        // ou detecta pelo idioma do dispositivo como fallback
        let resolvedCountry = country;
        if (!resolvedCountry) {
          const lang = navigator.language?.toLowerCase() || '';
          if (lang.startsWith('pt-br') || lang === 'pt') resolvedCountry = 'BR';
          else if (lang.startsWith('en-gb')) resolvedCountry = 'GB';
          else if (lang.startsWith('en')) resolvedCountry = 'US';
          else if (lang.startsWith('es')) resolvedCountry = 'ES';
          else if (lang.startsWith('fr')) resolvedCountry = 'FR';
          else if (lang.startsWith('de')) resolvedCountry = 'DE';
          else if (lang.startsWith('it')) resolvedCountry = 'IT';
          else if (lang.startsWith('pt')) resolvedCountry = 'PT';
          else if (lang.startsWith('nl')) resolvedCountry = 'NL';
          else resolvedCountry = 'US'; // padrão global
        }

        const accountId = `${user.uid}_${resolvedCountry}`;
        const accountDocRef = doc(db, 'bankAccounts', accountId);
        const accountSnapshot = await getDoc(accountDocRef);

        if (!accountSnapshot.exists()) {
          console.log(`💼 Criando conta bancária automática para o país: ${resolvedCountry}`);
          const bankAccount = generateBankAccountByCountry(resolvedCountry, user.uid);
          await setDoc(accountDocRef, {
            ...bankAccount,
            id: accountId,
            userId: user.uid,
            isPrimary: true,
            createdAt: new Date(),
          });
          console.log(`✅ Conta bancária criada: ${accountId} (${bankAccount.currency})`);
        } else {
          console.log(`ℹ️ Conta bancária já existe: ${accountId}`);
        }

        // Se for Brasil, também cria as chaves PIX automáticas
        if (resolvedCountry === 'BR') {
          await createAutoPixKeys(user.uid, user.email || email, normalizedPhone);
        }
      } catch (bankError) {
        console.warn('⚠️ Erro ao criar conta bancária automática:', bankError);
      }
      // ────────────────────────────────────────────────────────────────────────

      try {
        await initializeUserPortfolio(user.uid);
      } catch (pError) {
        console.warn('⚠️ Erro ao inicializar portfolio:', pError);
      }
    } catch (error: any) {
      const errorCode = error.code;
      if (errorCode === 'auth/email-already-in-use') {
        throw new Error('Este e-mail já está cadastrado. Faça login ou use outro e-mail.');
      } else if (errorCode === 'auth/invalid-email') {
        throw new Error('E-mail inválido. Verifique e tente novamente.');
      } else if (errorCode === 'auth/weak-password') {
        throw new Error('Senha muito fraca. Use no mínimo 6 caracteres.');
      } else if (errorCode === 'auth/operation-not-allowed') {
        throw new Error('Cadastro com e-mail desabilitado. Entre em contato com o suporte.');
      } else {
        throw new Error(error.message || 'Erro ao criar conta. Tente novamente.');
      }
    }
  };

  // Login
  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await loadUserData(userCredential.user.uid);

      if (userData && userData.phone && userData.accountPin) {
        try {
          const normalizedPhone = normalizePhone(userData.phone);
          const newPassword = generatePasswordFromPhoneAndPin(normalizedPhone, userData.accountPin);
          await updatePassword(userCredential.user, newPassword);
        } catch (migrateError) {
          console.error('⚠️ Erro ao migrar senha:', migrateError);
        }
      }
    } catch (error: any) {
      const errorCode = error.code;
      if (errorCode === 'auth/user-not-found') {
        throw new Error('E-mail não cadastrado. Crie uma conta primeiro.');
      } else if (errorCode === 'auth/wrong-password') {
        throw new Error('Senha incorreta. Tente novamente.');
      } else if (errorCode === 'auth/invalid-email') {
        throw new Error('E-mail inválido. Verifique e tente novamente.');
      } else if (errorCode === 'auth/user-disabled') {
        throw new Error('Esta conta foi desabilitada. Entre em contato com o suporte.');
      } else if (errorCode === 'auth/too-many-requests') {
        throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else {
        throw new Error('Erro ao fazer login. Verifique suas credenciais.');
      }
    }
  };

  // Login com telefone + PIN
  const signInWithPhoneAndPin = async (phone: string, pin: string) => {
    try {
      const normalizedPhone = normalizePhone(phone);
      const usersRef = collection(db, 'users');
      let q = query(usersRef, where('phone', '==', normalizedPhone), limit(1));
      let querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        q = query(usersRef, where('phone', '==', phone), limit(1));
        querySnapshot = await getDocs(q);
      }

      if (querySnapshot.empty) {
        throw new Error('Número de telefone não cadastrado');
      }

      const userDoc = querySnapshot.docs[0];
      const userDataFromFirestore = userDoc.data() as UserData;

      if (userDataFromFirestore.accountPin !== pin) {
        throw new Error('PIN incorreto');
      }

      const generatedPassword = generatePasswordFromPhoneAndPin(normalizedPhone, pin);
      const generatedPasswordAlt = generatePasswordFromPhoneAndPinAlt(normalizedPhone, pin);

      // Tenta senha com salt original (Ethertron) primeiro, depois o alternativo (NexCoin)
      let loginSuccess = false;
      for (const pwd of [generatedPassword, generatedPasswordAlt]) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, userDataFromFirestore.email, pwd);
          await loadUserData(userCredential.user.uid);
          setPinVerifiedWithPersistence(true);
          loginSuccess = true;
          break;
        } catch (authError: any) {
          if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
            // Tenta próximo salt
            continue;
          } else {
            throw authError;
          }
        }
      }

      if (!loginSuccess) {
        try {
          await sendPasswordResetEmail(auth, userDataFromFirestore.email);
          throw new Error('Sua conta precisa ser atualizada. Enviamos um e-mail para redefinir sua senha.');
        } catch (resetError: any) {
          throw resetError;
        }
      }
    } catch (error: any) {
      if (error.message === 'Número de telefone não cadastrado' || error.message === 'PIN incorreto') {
        throw error;
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else {
        throw new Error(error.message || 'Erro ao fazer login. Tente novamente.');
      }
    }
  };

  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    try {
      const normalizedPhone = normalizePhone(phone);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', normalizedPhone), limit(1));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      return false;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const userDoc = await loadUserData(userCredential.user.uid);

      if (!userDoc) {
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userData: UserData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || '',
          phone: '',
          country: '',
          accountPin: '',
          createdAt: new Date(),
          aprovado: 'yes',
        };
        await setDoc(userDocRef, userData);
        setUserData(userData);
      }
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login com Google');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setPinVerifiedWithPersistence(false);
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer logout');
    }
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!userData) return false;
    const isValid = userData.accountPin === pin;
    if (isValid) setPinVerifiedWithPersistence(true);
    return isValid;
  };

  const checkIfUserHasPin = async (): Promise<boolean> => {
    if (!userData) return false;
    return !!userData.accountPin && userData.accountPin.length === 6;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserData(user.uid);
        try { await autoMigrateOnLogin(user.uid); } catch (e) { }
        setIsPinVerified(checkPinVerifiedFromStorage(user.uid));
      } else {
        setUserData(null);
        setIsPinVerified(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        setUserData(docSnapshot.data() as UserData);
      }
    });
    return unsubscribe;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !userData || userData.country !== 'BR') return;
    const checkAndCreatePixKeys = async () => {
      try {
        const pixKeysRef = collection(db, 'pixKeys');
        const q = query(pixKeysRef, where('userId', '==', user.uid), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
          await createAutoPixKeys(user.uid, userData.email, userData.phone);
        }
      } catch (error) { }
    };
    checkAndCreatePixKeys();
  }, [user?.uid, userData?.country]);

  const dismissAlert = async (alertId: string) => {
    if (!userData) return;
    const userDocRef = doc(db, 'users', userData.uid);
    const updatedData: UserData = {
      ...userData,
      preferences: {
        ...userData.preferences,
        dismissedAlerts: [...(userData.preferences?.dismissedAlerts || []), alertId],
      },
    };
    await setDoc(userDocRef, updatedData);
    setUserData(updatedData);
  };

  const updateLanguage = async (language: 'pt-BR' | 'en-US' | 'es') => {
    if (!userData) return;
    const userDocRef = doc(db, 'users', userData.uid);
    const updatedData = { ...userData, language };
    await setDoc(userDocRef, updatedData);
    setUserData(updatedData);
  };

  const updateVisibleCards = async (cards: string[]) => {
    if (!userData) return;
    const userDocRef = doc(db, 'users', userData.uid);
    const updatedData = {
      ...userData,
      preferences: { ...userData.preferences, visibleCards: cards }
    };
    await setDoc(userDocRef, updatedData);
    setUserData(updatedData);
  };

  return (
    <AuthContext.Provider value={{
      user, userData, loading, isAuthenticated: !!user, isPinVerified, auth,
      signUp, signIn, signInWithPhoneAndPin, signInWithGoogle, logout,
      verifyPin, setPinVerified: setIsPinVerified, checkIfUserHasPin,
      checkPhoneExists, reloadUserData, updateLanguage, updateVisibleCards,
      dismissAlert, syncPixKeys
    }}>
      {children}
    </AuthContext.Provider>
  );
}
