import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FiatRates {
  [key: string]: number;
}

interface FiatRatesContextType {
  rates: FiatRates;
  loading: boolean;
}

const FiatRatesContext = createContext<FiatRatesContextType>({
  rates: {},
  loading: true,
});

export function FiatRatesProvider({ children }: { children: ReactNode }) {
  const [rates, setRates] = useState<FiatRates>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Usando taxas estáticas para evitar problemas de CORS e dependências de APIs externas
        setRates({
          USD: 1,
          BRL: 5.20,
          EUR: 0.92,
          GBP: 0.79,
        });
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar taxas de câmbio:', error);
        // Fallback para taxas estáticas
        setRates({
          USD: 1,
          BRL: 5.20,
          EUR: 0.92,
          GBP: 0.79,
        });
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  return (
    <FiatRatesContext.Provider value={{ rates, loading }}>
      {children}
    </FiatRatesContext.Provider>
  );
}

export function useFiatRates() {
  return useContext(FiatRatesContext);
}