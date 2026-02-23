import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { translations, type Language } from '../lib/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: typeof translations.pt;
}

// Detectar idioma do navegador ANTES de criar o contexto
const detectBrowserLanguage = (): Language => {
  try {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('pt')) {
      return 'pt';
    } else if (browserLang.startsWith('es')) {
      return 'es';
    } else {
      return 'en';
    }
  } catch (error) {
    console.error('Erro ao detectar idioma do navegador:', error);
    return 'pt'; // Fallback para português
  }
};

// Criar contexto com valor padrão baseado no navegador
const defaultLanguage = detectBrowserLanguage();
const defaultValue: LanguageContextType = {
  language: defaultLanguage,
  setLanguage: async () => { },
  t: translations[defaultLanguage] as any
};

const LanguageContext = createContext<LanguageContextType>(defaultValue);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectBrowserLanguage());

  // Carregar idioma do Firestore quando usuário estiver autenticado
  useEffect(() => {
    try {
      const unsubscribeAuth = auth.onAuthStateChanged((user) => {
        if (user && user.uid) {
          // Usuário autenticado - escutar mudanças no idioma do Firestore
          const userRef = doc(db, 'users', user.uid);
          const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
            try {
              if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData?.language && ['pt', 'en', 'es'].includes(userData.language)) {
                  setLanguageState(userData.language as Language);
                } else {
                  // Se não tem idioma salvo ou é inválido, detectar do navegador
                  setLanguageState(detectBrowserLanguage());
                }
              } else {
                setLanguageState(detectBrowserLanguage());
              }
            } catch (error) {
              console.error('Erro ao processar dados do usuário:', error);
              setLanguageState(detectBrowserLanguage());
            }
          }, (error) => {
            // Silenciar erros de permissão - usuário usará idioma do navegador
            if (error.code !== 'permission-denied') {
              console.error('Erro ao escutar idioma do usuário:', error);
            }
            setLanguageState(detectBrowserLanguage());
          });

          return () => unsubscribeDoc();
        } else {
          // Usuário não autenticado - usar idioma do navegador
          setLanguageState(detectBrowserLanguage());
        }
      });

      return () => unsubscribeAuth();
    } catch (error) {
      console.error('Erro ao configurar listener de autenticação:', error);
      setLanguageState(detectBrowserLanguage());
    }
  }, []);

  const setLanguage = async (lang: Language) => {
    try {
      // Validar idioma
      if (!['pt', 'en', 'es'].includes(lang)) {
        console.error('Idioma inválido:', lang);
        return;
      }

      setLanguageState(lang);

      // Salvar no Firestore se usuário estiver autenticado
      const user = auth.currentUser;
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { language: lang });
          console.log('✅ Idioma salvo no Firestore:', lang);
        } catch (error) {
          console.error('Erro ao salvar idioma no Firestore:', error);
          // Não falhar silenciosamente - idioma local já foi atualizado
        }
      }
    } catch (error) {
      console.error('Erro ao definir idioma:', error);
    }
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: (translations[language] || translations.pt) as any
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  // Sempre retornar o contexto - nunca undefined devido ao valor padrão
  return context;
}