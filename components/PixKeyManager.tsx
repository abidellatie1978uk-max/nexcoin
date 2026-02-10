import { ArrowLeft, Copy, Check, RefreshCw, User, Mail, Phone, Hash, Smartphone } from 'lucide-react';
import { useState } from 'react';

interface PixKeyManagerProps {
  onBack: () => void;
  onKeyGenerated: (key: string, keyType: string) => void;
}

type PixKeyType = 'random' | 'cpf' | 'cnpj' | 'email' | 'phone';

export function PixKeyManager({ onBack, onKeyGenerated }: PixKeyManagerProps) {
  const [selectedType, setSelectedType] = useState<PixKeyType | null>(null);
  const [customKey, setCustomKey] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Gerar chave PIX aleatória (UUID v4)
  const generateRandomPixKey = () => {
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    setGeneratedKey(uuid);
    setSelectedType('random');
  };

  // Formatar CPF
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  // Formatar CNPJ
  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      return cleaned
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
    return value;
  };

  // Formatar Telefone
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
    }
    return value;
  };

  const handleCustomKeyChange = (value: string) => {
    if (selectedType === 'cpf') {
      setCustomKey(formatCPF(value));
    } else if (selectedType === 'cnpj') {
      setCustomKey(formatCNPJ(value));
    } else if (selectedType === 'phone') {
      setCustomKey(formatPhone(value));
    } else {
      setCustomKey(value);
    }
  };

  const handleConfirmKey = () => {
    const keyToUse = selectedType === 'random' ? generatedKey : customKey;
    if (!keyToUse) {
      alert('Informe uma chave válida');
      return;
    }

    // Validações básicas
    if (selectedType === 'cpf' && customKey.replace(/\D/g, '').length !== 11) {
      alert('CPF deve ter 11 dígitos');
      return;
    }
    if (selectedType === 'cnpj' && customKey.replace(/\D/g, '').length !== 14) {
      alert('CNPJ deve ter 14 dígitos');
      return;
    }
    if (selectedType === 'phone' && customKey.replace(/\D/g, '').length < 10) {
      alert('Telefone inválido');
      return;
    }
    if (selectedType === 'email' && !customKey.includes('@')) {
      alert('E-mail inválido');
      return;
    }

    const keyTypeLabel = {
      random: 'Chave Aleatória',
      cpf: 'CPF',
      cnpj: 'CNPJ',
      email: 'E-mail',
      phone: 'Telefone'
    }[selectedType];

    onKeyGenerated(keyToUse, keyTypeLabel);
  };

  const copyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
    
    document.body.removeChild(textArea);
  };

  const pixKeyTypes = [
    { id: 'random' as PixKeyType, name: 'Chave Aleatória', icon: Hash, description: 'UUID gerado automaticamente' },
    { id: 'cpf' as PixKeyType, name: 'CPF', icon: User, description: 'Pessoa física' },
    { id: 'cnpj' as PixKeyType, name: 'CNPJ', icon: User, description: 'Pessoa jurídica' },
    { id: 'email' as PixKeyType, name: 'E-mail', icon: Mail, description: 'Endereço de e-mail' },
    { id: 'phone' as PixKeyType, name: 'Telefone', icon: Phone, description: 'Número de celular' },
  ];

  // Se nenhum tipo foi selecionado, mostrar opções
  if (!selectedType) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col pb-24">
        <header className="px-6 pt-6 pb-4">
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-1">Criar Chave PIX</h1>
              <p className="text-sm text-gray-400">Escolha o tipo de chave para receber depósitos</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
          </div>
        </header>

        <div className="px-6 space-y-3">
          {pixKeyTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => {
                  setSelectedType(type.id);
                  if (type.id === 'random') {
                    generateRandomPixKey();
                  }
                }}
                className="w-full bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-lg mb-1">{type.name}</div>
                  <div className="text-sm text-gray-400">{type.description}</div>
                </div>
                <div className="text-gray-400">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-6 pt-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm">
            <p className="text-blue-200/90">
              <span className="font-semibold">💡 Dica:</span> A chave PIX será usada para receber depósitos. Você poderá compartilhá-la com quem quiser enviar dinheiro para você.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar formulário para o tipo selecionado
  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-24">
      <header className="px-6 pt-6 pb-4">
        <button 
          onClick={() => {
            setSelectedType(null);
            setCustomKey('');
            setGeneratedKey('');
          }} 
          className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {pixKeyTypes.find(t => t.id === selectedType)?.name}
            </h1>
            <p className="text-sm text-gray-400">
              {pixKeyTypes.find(t => t.id === selectedType)?.description}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
            {(() => {
              const Icon = pixKeyTypes.find(t => t.id === selectedType)?.icon || Hash;
              return <Icon className="w-6 h-6 text-white" />;
            })()}
          </div>
        </div>
      </header>

      <div className="px-6 space-y-4">
        {/* Chave Aleatória - já gerada */}
        {selectedType === 'random' && (
          <>
            <div className="bg-zinc-900 rounded-2xl p-4">
              <label className="block text-xs text-gray-400 mb-2 font-semibold">Sua chave PIX aleatória</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 text-sm font-mono text-gray-300 overflow-hidden">
                  <div className="truncate">{generatedKey}</div>
                </div>
                <button 
                  onClick={() => copyToClipboard(generatedKey)} 
                  className="flex-shrink-0 w-12 h-12 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-all active:scale-95"
                >
                  {copiedKey ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                </button>
              </div>
              {copiedKey && <p className="text-xs text-green-500 mt-2 text-center font-semibold">Chave copiada!</p>}
            </div>

            <button
              onClick={generateRandomPixKey}
              className="w-full bg-zinc-900 text-white rounded-xl px-4 py-4 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="font-semibold">Gerar nova chave</span>
            </button>
          </>
        )}

        {/* Formulários para outros tipos */}
        {selectedType === 'cpf' && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <label className="block text-xs text-gray-400 mb-2 font-semibold">CPF</label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={customKey}
              onChange={(e) => handleCustomKeyChange(e.target.value)}
              maxLength={14}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 font-mono"
            />
            <p className="text-xs text-gray-400 mt-2">
              Informe seu CPF para usar como chave PIX
            </p>
          </div>
        )}

        {selectedType === 'cnpj' && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <label className="block text-xs text-gray-400 mb-2 font-semibold">CNPJ</label>
            <input
              type="text"
              placeholder="00.000.000/0000-00"
              value={customKey}
              onChange={(e) => handleCustomKeyChange(e.target.value)}
              maxLength={18}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 font-mono"
            />
            <p className="text-xs text-gray-400 mt-2">
              Informe seu CNPJ para usar como chave PIX
            </p>
          </div>
        )}

        {selectedType === 'email' && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <label className="block text-xs text-gray-400 mb-2 font-semibold">E-mail</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={customKey}
              onChange={(e) => handleCustomKeyChange(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500"
            />
            <p className="text-xs text-gray-400 mt-2">
              Informe seu e-mail para usar como chave PIX
            </p>
          </div>
        )}

        {selectedType === 'phone' && (
          <div className="bg-zinc-900 rounded-2xl p-4">
            <label className="block text-xs text-gray-400 mb-2 font-semibold">Telefone</label>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={customKey}
              onChange={(e) => handleCustomKeyChange(e.target.value)}
              maxLength={15}
              className="w-full bg-zinc-800 text-white rounded-xl px-4 py-3 outline-none placeholder-gray-500 font-mono"
            />
            <p className="text-xs text-gray-400 mt-2">
              Informe seu celular para usar como chave PIX
            </p>
          </div>
        )}

        {/* Informações */}
        <div className="bg-zinc-900 rounded-2xl p-4">
          <h3 className="font-semibold mb-3 text-sm">Como funciona</h3>
          <ol className="space-y-2 text-sm text-gray-400">
            <li className="flex gap-2">
              <span className="text-white font-semibold">1.</span>
              <span>Crie ou informe sua chave PIX</span>
            </li>
            <li className="flex gap-2">
              <span className="text-white font-semibold">2.</span>
              <span>Compartilhe a chave com quem vai enviar</span>
            </li>
            <li className="flex gap-2">
              <span className="text-white font-semibold">3.</span>
              <span>Receba o dinheiro instantaneamente</span>
            </li>
          </ol>
        </div>

        {/* Botão Confirmar */}
        <button
          onClick={handleConfirmKey}
          className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors"
        >
          Confirmar e usar esta chave
        </button>
      </div>
    </div>
  );
}
