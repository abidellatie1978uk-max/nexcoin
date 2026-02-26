import { createContext, useContext, useState, ReactNode } from 'react';

interface LoginFlowContextType {
  phoneNumber: string;
  setPhoneNumber: (phone: string) => void;
}

const LoginFlowContext = createContext<LoginFlowContextType>({
  phoneNumber: '',
  setPhoneNumber: () => {},
});

export function useLoginFlow() {
  return useContext(LoginFlowContext);
}

interface LoginFlowProviderProps {
  children: ReactNode;
}

export function LoginFlowProvider({ children }: LoginFlowProviderProps) {
  const [phoneNumber, setPhoneNumber] = useState('');

  const value = {
    phoneNumber,
    setPhoneNumber,
  };

  return (
    <LoginFlowContext.Provider value={value}>
      {children}
    </LoginFlowContext.Provider>
  );
}
