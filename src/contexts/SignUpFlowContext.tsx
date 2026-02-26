import { createContext, useContext, useState, ReactNode } from 'react';

interface SignUpData {
  name: string;
  email: string;
  phone: string;
  password: string;
  country: string;
}

interface SignUpFlowContextType {
  signUpData: SignUpData | null;
  setSignUpData: (data: SignUpData) => void;
  clearSignUpData: () => void;
}

const SignUpFlowContext = createContext<SignUpFlowContextType>({
  signUpData: null,
  setSignUpData: () => {},
  clearSignUpData: () => {},
});

export function useSignUpFlow() {
  return useContext(SignUpFlowContext);
}

interface SignUpFlowProviderProps {
  children: ReactNode;
}

export function SignUpFlowProvider({ children }: SignUpFlowProviderProps) {
  const [signUpData, setSignUpDataState] = useState<SignUpData | null>(null);

  const setSignUpData = (data: SignUpData) => {
    setSignUpDataState(data);
  };

  const clearSignUpData = () => {
    setSignUpDataState(null);
  };

  return (
    <SignUpFlowContext.Provider value={{ signUpData, setSignUpData, clearSignUpData }}>
      {children}
    </SignUpFlowContext.Provider>
  );
}
