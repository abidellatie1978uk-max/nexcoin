import { Check, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Screen } from "../App";
import { FlagIcon } from "./FlagIcon";
import { useSignUpFlow } from "../contexts/SignUpFlowContext";

interface CountrySelectionProps {
  onNavigate: (screen: Screen) => void;
}

export function CountrySelection({
  onNavigate,
}: CountrySelectionProps) {
  const { signUpData, setSignUpData } = useSignUpFlow();
  const [selectedCountry, setSelectedCountry] = useState<
    string | null
  >(null);
  const [selectedCurrency, setSelectedCurrency] = useState<
    string | null
  >(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const countries = [
    { id: "BR", name: "Brasil", code: "BR", currency: "BRL" },
    {
      id: "US",
      name: "Estados Unidos",
      code: "US",
      currency: "USD",
    },
    { id: "PT", name: "Portugal", code: "PT", currency: "EUR" },
    { id: "ES", name: "Espanha", code: "ES", currency: "EUR" },
    { id: "FR", name: "França", code: "FR", currency: "EUR" },
    { id: "DE", name: "Alemanha", code: "DE", currency: "EUR" },
    { id: "IT", name: "Itália", code: "IT", currency: "EUR" },
    {
      id: "GB",
      name: "Reino Unido",
      code: "GB",
      currency: "EUR",
    },
    { id: "NL", name: "Holanda", code: "NL", currency: "EUR" },
    { id: "BE", name: "Bélgica", code: "BE", currency: "EUR" },
    { id: "CH", name: "Suíça", code: "CH", currency: "EUR" },
    { id: "AT", name: "Áustria", code: "AT", currency: "EUR" },
  ];

  const currencies = [
    {
      id: "BRL",
      name: "Real Brasileiro",
      symbol: "R$",
      code: "BR",
    },
    {
      id: "USD",
      name: "Dólar Americano",
      symbol: "$",
      code: "US",
    },
    { id: "EUR", name: "Euro", symbol: "€", code: "EU" },
  ];

  const selectedCountryData = countries.find(
    (c) => c.id === selectedCountry,
  );

  const handleCountrySelect = (
    countryId: string,
    currency: string,
  ) => {
    setSelectedCountry(countryId);
    setSelectedCurrency(currency);
    setIsDropdownOpen(false);
  };

  const handleContinue = () => {
    if (selectedCountry && selectedCurrency && signUpData) {
      // Atualizar dados com o país selecionado
      setSignUpData({
        ...signUpData,
        country: selectedCountry,
      });
      // Ir para criação de PIN
      onNavigate('pinSetup');
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col p-6">
      {/* Header */}
      <div className="w-full max-w-md mx-auto pt-4 pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-center mb-2">
          NexCoin
        </h1>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-md mx-auto flex-1 overflow-y-auto hide-scrollbar">
        <div className="space-y-2 mb-6">
          <h2 className="text-3xl font-bold tracking-tight">
            Configuração inicial
          </h2>
          <p className="text-slate-400 text-sm">
            Selecione seu país de origem e a moeda preferencial
            para suas transações.
          </p>
        </div>

        {/* Country Dropdown */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">
            País de origem
          </h3>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-zinc-900 rounded-2xl p-4 flex items-center justify-between hover:bg-zinc-800 transition-all"
            >
              {selectedCountryData ? (
                <div className="flex items-center gap-3">
                  <FlagIcon
                    countryCode={selectedCountryData.code}
                    size="md"
                  />
                  <div className="text-left">
                    <div className="font-semibold">
                      {selectedCountryData.name}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-gray-400">
                    Selecione um país
                  </span>
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </>
              )}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 rounded-2xl border border-zinc-800 max-h-80 overflow-y-auto hide-scrollbar z-50 shadow-xl">
                {countries.map((country) => (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() =>
                      handleCountrySelect(
                        country.id,
                        country.currency,
                      )
                    }
                    className="w-full p-4 flex items-center gap-3 hover:bg-zinc-800 transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <FlagIcon
                      countryCode={country.code}
                      size="sm"
                    />
                    <div className="text-left flex-1">
                      <div className="font-semibold">
                        {country.name}
                      </div>
                    </div>
                    {selectedCountry === country.id && (
                      <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <Check className="w-3 h-3 text-black" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Currency Selection */}
        <div className="space-y-3">
          <label className="text-lg font-semibold">
            Moeda Preferencial
          </label>
          <p className="text-sm text-gray-400 mb-4">
            Escolha a moeda que deseja usar como padrão
          </p>

          {currencies.map((currency) => (
            <button
              key={currency.id}
              type="button"
              onClick={() => setSelectedCurrency(currency.id)}
              className={`w-full bg-zinc-900 rounded-2xl p-4 flex items-center justify-between transition-all duration-300 ${
                selectedCurrency === currency.id
                  ? "ring-1 ring-inset ring-white/60"
                  : "hover:bg-zinc-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <FlagIcon
                  countryCode={currency.code}
                  size="md"
                />
                <div className="text-left">
                  <div className="font-semibold">
                    {currency.name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {currency.symbol} {currency.id}
                  </div>
                </div>
              </div>
              {selectedCurrency === currency.id && (
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <Check className="w-4 h-4 text-black" />
                </div>
              )}
            </button>
          ))}
        </div>
      </main>

      {/* Continue Button */}
      <button
        type="button"
        onClick={handleContinue}
        className={`w-full py-4 rounded-full font-semibold transition-all duration-300 ${
          selectedCountry && selectedCurrency
            ? "bg-white text-black hover:opacity-90 active:scale-[0.98]"
            : "bg-zinc-800 text-gray-500 cursor-not-allowed"
        }`}
        disabled={!selectedCountry || !selectedCurrency}
      >
        Continuar
      </button>
    </div>
  );
}