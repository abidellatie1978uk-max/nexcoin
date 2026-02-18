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
  const PIN_VERIFIED_KEY = 'Ethertron_pin_verified';

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
  // NOTA: Esta é uma solução temporária. Em produção, use Custom Tokens do Firebase
  const generatePasswordFromPhoneAndPin = (phone: string, pin: string): string => {
    // Gera uma senha combinando telefone + PIN + salt
    // O salt deve ser o mesmo sempre para o mesmo usuário
    const salt = 'Ethertron2024!'; // Salt fixo (em produção, use algo mais seguro)
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

  // ✅ CRIAR CHAVES PIX AUTOMÁTICAS PARA USUÁRIOS BRASILEIROS
  const createAutoPixKeys = async (userId: string, userEmail: string, userPhone: string) => {
    try {
      console.log('🔑 Criando chaves PIX automáticas para usuário brasileiro...');

      // Buscar conta bancária BRL do usuário
      const accountsRef = collection(db, 'bankAccounts');
      const accountQuery = query(
        accountsRef,
        where('userId', '==', userId),
        where('currency', '==', 'BRL'),
        limit(1)
      );
      const accountSnapshot = await getDocs(accountQuery);

      let accountId = '';
      let accountNumber = '';

      if (accountSnapshot.empty) {
        // Criar conta BRL se não existir
        console.log('💼 Criando conta bancária BRL...');
        const newAccount = generateBankAccountByCountry('BR', userId);
        const accountDocRef = await addDoc(accountsRef, {
          ...newAccount,
          userId: userId,
          isPrimary: true,
          createdAt: new Date(),
        });
        accountId = accountDocRef.id;
        accountNumber = newAccount.accountNumber;
        console.log('✅ Conta BRL criada:', accountId);
      } else {
        // Usar conta existente
        const accountDoc = accountSnapshot.docs[0];
        accountId = accountDoc.id;
        accountNumber = accountDoc.data().accountNumber;
        console.log('✅ Conta BRL encontrada:', accountId);
      }

      // Verificar se chaves PIX já existem
      const pixKeysRef = collection(db, 'pixKeys');
      const existingKeysQuery = query(
        pixKeysRef,
        where('userId', '==', userId),
        where('accountId', '==', accountId)
      );
      const existingKeysSnapshot = await getDocs(existingKeysQuery);

      if (!existingKeysSnapshot.empty) {
        console.log('ℹ️ Chaves PIX já existem para este usuário');
        return;
      }

      // Criar chave PIX de EMAIL
      await addDoc(pixKeysRef, {
        userId: userId,
        accountId: accountId,
        accountNumber: accountNumber,
        currency: 'BRL',
        country: 'BR',
        keyType: 'email',
        keyValue: userEmail,
        createdAt: new Date(),
      });
      console.log('✅ Chave PIX (email) criada:', userEmail);

      // Criar chave PIX de TELEFONE (formatar para PIX - remover +55)
      const pixPhone = formatPhoneForPix(userPhone);
      await addDoc(pixKeysRef, {
        userId: userId,
        accountId: accountId,
        accountNumber: accountNumber,
        currency: 'BRL',
        country: 'BR',
        keyType: 'phone',
        keyValue: pixPhone,
        createdAt: new Date(),
      });
      console.log('✅ Chave PIX (telefone) criada:', pixPhone);

      console.log('🎉 Chaves PIX automáticas criadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao criar chaves PIX automáticas:', error);
      // Não propagar erro - não é crítico
    }
  };

  // ✅ SINCRONIZAR CHAVES PIX QUANDO EMAIL OU TELEFONE MUDAM
  const syncPixKeys = async (userId: string, newEmail?: string, newPhone?: string) => {
    try {
      console.log('🔄 Sincronizando chaves PIX com novos dados do perfil...');

      const pixKeysRef = collection(db, 'pixKeys');

      // Buscar todas as chaves PIX do usuário
      const q = query(pixKeysRef, where('userId', '==', userId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.log('ℹ️ Nenhuma chave PIX encontrada para sincronizar');
        return;
      }

      // Atualizar chaves PIX
      const updatePromises: Promise<void>[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const pixKeyRef = doc(db, 'pixKeys', docSnap.id);

        // Atualizar chave de email
        if (data.keyType === 'email' && newEmail) {
          console.log('📧 Atualizando chave PIX de email:', newEmail);
          updatePromises.push(
            updateDoc(pixKeyRef, { keyValue: newEmail }) as Promise<void>
          );
        }

        // Atualizar chave de telefone
        if (data.keyType === 'phone' && newPhone) {
          console.log('📱 Atualizando chave PIX de telefone:', newPhone);
          updatePromises.push(
            updateDoc(pixKeyRef, { keyValue: newPhone }) as Promise<void>
          );
        }
      });

      await Promise.all(updatePromises);
      console.log('✅ Chaves PIX sincronizadas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao sincronizar chaves PIX:', error);
      // Não propagar erro - não é crítico
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
      // ⚠️ NORMALIZAR TELEFONE: Remover formatação antes de salvar
      const normalizedPhone = normalizePhone(phone);

      // Verificar se o telefone já está cadastrado
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', normalizedPhone), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        throw new Error('Este número de telefone já está cadastrado');
      }

      // ✅ GERAR SENHA BASEADA NO TELEFONE + PIN
      // Isso permite login posterior usando apenas telefone + PIN
      const generatedPassword = generatePasswordFromPhoneAndPin(normalizedPhone, accountPin);

      // Criar usuário no Firebase Auth com a senha gerada
      const userCredential = await createUserWithEmailAndPassword(auth, email, generatedPassword);
      const user = userCredential.user;

      // Salvar dados do usuário no Firestore (incluindo telefone NORMALIZADO)
      const userDocRef = doc(db, 'users', user.uid);
      const userData: UserData = {
        uid: user.uid,
        email: user.email || email,
        name,
        phone: normalizedPhone, // ⚠️ SALVANDO TELEFONE NORMALIZADO (+5511999999999)
        country,
        accountPin, // PIN de 6 dígitos
        createdAt: new Date(),
        aprovado: 'yes', // ✅ NOVO: Usuários novos iniciam aprovados (pode mudar para 'no' depois)
      };

      await setDoc(userDocRef, userData);
      setUserData(userData);

      // Inicializar o portfólio do usuário
      await initializeUserPortfolio(user.uid);

      // ✅ CRIAR CHAVES PIX AUTOMÁTICAS PARA USUÁRIOS BRASILEIROS
      if (country === 'BR') {
        await createAutoPixKeys(user.uid, email, normalizedPhone);
      }
    } catch (error: any) {
      // Traduzir erros do Firebase para português
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

      // ✅ MIGRAÇÃO AUTOMÁTICA: Se usuário tem telefone + PIN, atualizar senha
      if (userData && userData.phone && userData.accountPin) {
        try {
          const normalizedPhone = normalizePhone(userData.phone);
          const newPassword = generatePasswordFromPhoneAndPin(normalizedPhone, userData.accountPin);

          // Atualizar senha do usuário
          await updatePassword(userCredential.user, newPassword);
          console.log('✅ Senha migrada com sucesso! Agora você pode fazer login com telefone + PIN.');
        } catch (migrateError) {
          console.error('⚠️ Erro ao migrar senha:', migrateError);
          // Não propagar erro - login ainda funcionou
        }
      }
    } catch (error: any) {
      // Traduzir erros do Firebase para português
      const errorCode = error.code;

      if (errorCode === 'auth/user-not-found') {
        throw new Error('E-mail não cadastrado. Crie uma conta primeiro.');;
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
      console.log('🔍 Iniciando login com telefone + PIN...');
      console.log('📱 Telefone recebido (original):', phone);

      // Normalizar telefone (remover formatação)
      const normalizedPhone = normalizePhone(phone);
      console.log('📱 Telefone normalizado:', normalizedPhone);

      // Buscar usuário pelo telefone no Firestore
      const usersRef = collection(db, 'users');
      let q = query(usersRef, where('phone', '==', normalizedPhone), limit(1));
      let querySnapshot = await getDocs(q);

      console.log('🔍 Busca com telefone normalizado - Encontrado:', !querySnapshot.empty);

      // Fallback: tentar buscar com o telefone original se não encontrou
      if (querySnapshot.empty) {
        console.log('⚠️ Não encontrou com telefone normalizado, tentando original...');
        q = query(usersRef, where('phone', '==', phone), limit(1));
        querySnapshot = await getDocs(q);
        console.log('🔍 Busca com telefone original - Encontrado:', !querySnapshot.empty);
      }

      if (querySnapshot.empty) {
        console.error('❌ Telefone não cadastrado. Tentativas:');
        console.error('   - Normalizado:', normalizedPhone);
        console.error('   - Original:', phone);
        throw new Error('Número de telefone não cadastrado');
      }

      // Pegar o primeiro documento (telefone deve ser único)
      const userDoc = querySnapshot.docs[0];
      const userDataFromFirestore = userDoc.data() as UserData;
      console.log('✅ Usuário encontrado:', userDataFromFirestore.email);
      console.log('📞 Telefone cadastrado:', userDataFromFirestore.phone);

      // Verificar se o PIN está correto
      if (userDataFromFirestore.accountPin !== pin) {
        console.error('❌ PIN incorreto');
        throw new Error('PIN incorreto');
      }

      console.log('✅ PIN correto! Autenticando no Firebase Auth...');

      // ✅ AUTENTICAR NO FIREBASE AUTH
      // Usar a senha gerada a partir do telefone e PIN
      const generatedPassword = generatePasswordFromPhoneAndPin(normalizedPhone, pin);

      try {
        // Tentar login com e-mail e senha gerada
        const userCredential = await signInWithEmailAndPassword(auth, userDataFromFirestore.email, generatedPassword);
        console.log('✅ Login bem-sucedido!');

        // Carregar dados do usuário
        await loadUserData(userCredential.user.uid);
        setPinVerifiedWithPersistence(true);

      } catch (authError: any) {
        console.warn('⚠️ Falha no login com senha gerada. Código:', authError.code);

        // Se falhou por credencial inválida, pode ser usuário antigo
        // Vamos tentar fazer login com qualquer método disponível e atualizar a senha
        if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
          console.log('🔧 Tentando recuperar acesso para usuário antigo...');

          // Enviar email de reset de senha para o usuário
          // Isso permitirá que ele configure uma nova senha
          try {
            await sendPasswordResetEmail(auth, userDataFromFirestore.email);
            throw new Error('Sua conta precisa ser atualizada. Enviamos um e-mail para redefinir sua senha. Após redefinir, você poderá fazer login com telefone + PIN.');
          } catch (resetError: any) {
            if (resetError.message.includes('Enviamos um e-mail')) {
              throw resetError; // Propagar mensagem de sucesso
            }
            console.error('❌ Erro ao enviar e-mail de reset:', resetError);
            throw new Error('Erro ao processar login. Entre em contato com o suporte.');
          }
        } else {
          // Outro tipo de erro do Auth
          throw authError;
        }
      }

    } catch (error: any) {
      console.error('❌ Erro no signInWithPhoneAndPin:', error);

      // Propagar erros específicos
      if (error.message === 'Número de telefone não cadastrado' || error.message === 'PIN incorreto') {
        throw error;
      } else if (error.message && error.message.includes('Enviamos um e-mail')) {
        throw error; // Mensagem de reset de senha
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('PIN incorreto');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('Número de telefone não cadastrado');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
      } else {
        throw new Error('Erro ao fazer login. Tente novamente.');
      }
    }
  };

  // Verificar se o telefone existe no banco de dados
  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    try {
      console.log('🔍 ============ CHECK PHONE EXISTS ============');
      console.log('🔍 Telefone recebido (original):', phone);

      // Normalizar telefone (remover formatação)
      const normalizedPhone = normalizePhone(phone);
      console.log('🔍 Telefone normalizado:', normalizedPhone);

      const usersRef = collection(db, 'users');

      // Buscar telefone normalizado
      console.log('🔍 Buscando com telefone normalizado...');
      let q = query(usersRef, where('phone', '==', normalizedPhone), limit(1));
      let querySnapshot = await getDocs(q);

      console.log('🔍 Resultado busca normalizado:', !querySnapshot.empty ? 'ENCONTRADO ✅' : 'NÃO ENCONTRADO ❌');

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        console.log('✅ Usuário encontrado:', userData.name, '| Email:', userData.email);
        console.log('✅ ==========================================');
        return true;
      }

      // Fallback: tentar buscar com o telefone original se não encontrou
      console.log('🔍 Buscando com telefone original...');
      q = query(usersRef, where('phone', '==', phone), limit(1));
      querySnapshot = await getDocs(q);

      console.log('🔍 Resultado busca original:', !querySnapshot.empty ? 'ENCONTRADO ✅' : 'NÃO ENCONTRADO ❌');

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        console.log('✅ Usuário encontrado:', userData.name, '| Email:', userData.email);
        console.log('✅ ==========================================');
        return true;
      }

      console.error('❌ ============ TELEFONE NÃO ENCONTRADO ============');
      console.error('❌ Tentativas:');
      console.error('   1. Normalizado:', normalizedPhone);
      console.error('   2. Original:', phone);
      console.error('❌ ================================================');

      return false;
    } catch (error: any) {
      console.error('❌ Erro ao verificar telefone:', error);

      // Se for erro de permissão, propagar erro especial
      if (error.code === 'permission-denied') {
        throw new Error('FIRESTORE_PERMISSION_DENIED');
      }
      return false;
    }
  };

  // Login com Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);

      // Verificar se o usuário já existe no Firestore
      const userDoc = await loadUserData(userCredential.user.uid);

      // Se não existe, criar documento básico (vai precisar criar PIN depois)
      if (!userDoc) {
        const userDocRef = doc(db, 'users', userCredential.user.uid);
        const userData: UserData = {
          uid: userCredential.user.uid,
          email: userCredential.user.email || '',
          name: userCredential.user.displayName || '',
          phone: '',
          country: '',
          accountPin: '', // Vai precisar criar depois
          createdAt: new Date(),
          aprovado: 'yes', // ✅ NOVO: Usuários novos iniciam aprovados
        };
        await setDoc(userDocRef, userData);
        setUserData(userData);
      }
    } catch (error: any) {
      console.error('Erro ao fazer login com Google:', error);
      throw new Error(error.message || 'Erro ao fazer login com Google');
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setPinVerifiedWithPersistence(false);
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      throw new Error(error.message || 'Erro ao fazer logout');
    }
  };

  // Verificar PIN de 6 dígitos
  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!userData) return false;

    const isValid = userData.accountPin === pin;
    if (isValid) {
      setPinVerifiedWithPersistence(true);
    }
    return isValid;
  };

  // Verificar se usuário tem PIN configurado
  const checkIfUserHasPin = async (): Promise<boolean> => {
    if (!userData) return false;
    return !!userData.accountPin && userData.accountPin.length === 6;
  };

  // Monitorar mudanças de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        await loadUserData(user.uid);

        // ✅ MIGRAÇÃO AUTOMÁTICA: Migrar wallets para portfolio ao fazer login
        try {
          await autoMigrateOnLogin(user.uid);
        } catch (error) {
          console.error('⚠️ Erro na migração automática (não crítico):', error);
          // Não propagar erro - login ainda funcionou
        }

        // ✅ VERIFICAR PIN DO LOCALSTORAGE
        const isPinVerified = checkPinVerifiedFromStorage(user.uid);
        setIsPinVerified(isPinVerified);
      } else {
        setUserData(null);
        setIsPinVerified(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 🚀 REALTIME: Sincronização em tempo real dos dados do usuário
  useEffect(() => {
    if (!user?.uid) return;

    console.log('🔄 Iniciando sincronização em tempo real dos dados do usuário...');

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data() as UserData;
          console.log('✅ Dados do usuário atualizados em tempo real:', data.name);
          setUserData(data);
        } else {
          console.warn('⚠️ Documento do usuário não existe');
          setUserData(null);
        }
      },
      (error) => {
        console.error('❌ Erro na sincronização em tempo real:', error);
      }
    );

    // Cleanup: cancelar listener quando o componente desmontar ou usuário mudar
    return () => {
      console.log('🛑 Parando sincronização em tempo real dos dados do usuário');
      unsubscribe();
    };
  }, [user?.uid]);

  // ✅ VERIFICAR E CRIAR CHAVES PIX AUTOMATICAMENTE PARA USUÁRIOS BRASILEIROS
  useEffect(() => {
    if (!user?.uid || !userData) return;

    // Só criar chaves para usuários brasileiros
    if (userData.country !== 'BR') {
      console.log('ℹ️ Usuário não é brasileiro, pulando criação de chaves PIX');
      return;
    }

    // Verificar se as chaves PIX já existem
    const checkAndCreatePixKeys = async () => {
      try {
        console.log('🔍 Verificando se chaves PIX existem para o usuário...');

        const pixKeysRef = collection(db, 'pixKeys');
        const q = query(pixKeysRef, where('userId', '==', user.uid), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          console.log('⚠️ Chaves PIX não encontradas, criando automaticamente...');
          await createAutoPixKeys(user.uid, userData.email, userData.phone);
        } else {
          console.log('✅ Chaves PIX já existem para este usuário');
        }
      } catch (error) {
        console.error('❌ Erro ao verificar/criar chaves PIX:', error);
      }
    };

    checkAndCreatePixKeys();
  }, [user?.uid, userData?.country]);

  // Descartar alerta para o usuário
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

  // Atualizar idioma do usuário
  const updateLanguage = async (language: 'pt-BR' | 'en-US' | 'es') => {
    if (!userData) return;

    const userDocRef = doc(db, 'users', userData.uid);
    const updatedData: UserData = {
      ...userData,
      language,
    };

    await setDoc(userDocRef, updatedData);
    setUserData(updatedData);
  };

  // Atualizar cartões visíveis do usuário
  const updateVisibleCards = async (cards: string[]) => {
    if (!userData) return;

    const userDocRef = doc(db, 'users', userData.uid);
    const updatedData: UserData = {
      ...userData,
      preferences: {
        ...userData.preferences,
        visibleCards: cards,
      },
    };

    await setDoc(userDocRef, updatedData);
    setUserData(updatedData);
  };

  // ✅ SINCRONIZAÇÃO AUTOMÁTICA: Atualizar chaves PIX quando email ou telefone mudarem
  useEffect(() => {
    if (!user?.uid || !userData) return;

    // Guardar valores anteriores em uma ref para detectar mudanças
    const emailChanged = previousEmail.current !== userData.email;
    const phoneChanged = previousPhone.current !== userData.phone;

    if (emailChanged || phoneChanged) {
      console.log('🔄 Detectada mudança no perfil, sincronizando chaves PIX...');

      // Sincronizar chaves PIX
      syncPixKeys(
        user.uid,
        emailChanged ? userData.email : undefined,
        phoneChanged ? userData.phone : undefined
      );

      // Atualizar refs
      previousEmail.current = userData.email;
      previousPhone.current = userData.phone;
    }
  }, [userData?.email, userData?.phone, user?.uid]);

  const value = {
    user,
    userData,
    loading,
    isAuthenticated: !!user,
    isPinVerified,
    auth: auth,
    signUp,
    signIn,
    signInWithPhoneAndPin,
    signInWithGoogle,
    logout,
    verifyPin,
    setPinVerified: setPinVerifiedWithPersistence,
    checkIfUserHasPin,
    checkPhoneExists,
    reloadUserData,
    updateLanguage,
    updateVisibleCards,
    dismissAlert,
    syncPixKeys,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}