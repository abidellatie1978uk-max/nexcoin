import React, { useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { X, Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface DiagnosticPixKeysProps {
  onClose: () => void;
}

export function DiagnosticPixKeys({ onClose }: DiagnosticPixKeysProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostic = async () => {
    if (!user) {
      alert('Usuário não autenticado');
      return;
    }

    setLoading(true);
    console.log('🔍 ========================================');
    console.log('🔍 DIAGNÓSTICO DE CHAVES PIX');
    console.log('🔍 ========================================');
    
    try {
      // 1. Buscar dados do usuário
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      console.log('👤 Dados do Usuário:');
      console.log('   UID:', user.uid);
      console.log('   Nome:', userData?.name);
      console.log('   Email:', userData?.email);
      console.log('   Telefone:', userData?.phone);
      console.log('   País:', userData?.country);

      // 2. Buscar TODAS as chaves PIX do sistema
      const pixKeysRef = collection(db, 'pixKeys');
      const allKeysSnapshot = await getDocs(pixKeysRef);

      console.log('\n🔑 Total de chaves PIX no sistema:', allKeysSnapshot.size);
      
      const allKeys: any[] = [];
      const userKeys: any[] = [];

      allKeysSnapshot.forEach((doc) => {
        const data = doc.data();
        allKeys.push({
          id: doc.id,
          ...data,
        });

        if (data.userId === user.uid) {
          userKeys.push({
            id: doc.id,
            ...data,
          });
        }
      });

      console.log('\n📋 TODAS AS CHAVES DO SISTEMA:');
      allKeys.forEach((key, index) => {
        console.log(`  [${index + 1}]`);
        console.log(`      ID: ${key.id}`);
        console.log(`      keyValue: "${key.keyValue}"`);
        console.log(`      keyType: ${key.keyType}`);
        console.log(`      userId: ${key.userId}`);
        console.log(`      accountNumber: ${key.accountNumber}`);
        console.log(`      currency: ${key.currency}`);
        console.log(`      country: ${key.country}`);
      });

      console.log('\n🎯 CHAVES DO USUÁRIO ATUAL:');
      if (userKeys.length === 0) {
        console.error('   ❌ NENHUMA CHAVE ENCONTRADA!');
      } else {
        userKeys.forEach((key, index) => {
          console.log(`  [${index + 1}]`);
          console.log(`      ID: ${key.id}`);
          console.log(`      keyValue: "${key.keyValue}"`);
          console.log(`      keyType: ${key.keyType}`);
          console.log(`      accountNumber: ${key.accountNumber}`);
          console.log(`      currency: ${key.currency}`);
        });
      }

      // 3. Verificar contas bancárias
      const accountsRef = collection(db, 'users', user.uid, 'bankAccounts');
      const accountsSnapshot = await getDocs(accountsRef);

      console.log('\n🏦 Contas Bancárias:');
      const accounts: any[] = [];
      accountsSnapshot.forEach((doc) => {
        const data = doc.data();
        accounts.push({
          id: doc.id,
          ...data,
        });
        console.log(`  - ${data.currency}: ${data.accountNumber} (${data.bankName})`);
      });

      // 4. Diagnóstico
      const diagnostic = {
        userEmail: userData?.email,
        userPhone: userData?.phone,
        hasEmailKey: userKeys.some(k => k.keyType === 'email'),
        hasPhoneKey: userKeys.some(k => k.keyType === 'phone'),
        emailKeyValue: userKeys.find(k => k.keyType === 'email')?.keyValue,
        phoneKeyValue: userKeys.find(k => k.keyType === 'phone')?.keyValue,
        totalKeysInSystem: allKeys.length,
        userKeysCount: userKeys.length,
        hasBRLAccount: accounts.some(a => a.currency === 'BRL'),
      };

      console.log('\n📊 DIAGNÓSTICO:');
      console.log('   Email no perfil:', diagnostic.userEmail);
      console.log('   Telefone no perfil:', diagnostic.userPhone);
      console.log('   Tem chave EMAIL?', diagnostic.hasEmailKey ? '✅' : '❌');
      console.log('   Tem chave TELEFONE?', diagnostic.hasPhoneKey ? '✅' : '❌');
      console.log('   Valor chave EMAIL:', diagnostic.emailKeyValue || 'N/A');
      console.log('   Valor chave TELEFONE:', diagnostic.phoneKeyValue || 'N/A');
      console.log('   Total de chaves no sistema:', diagnostic.totalKeysInSystem);
      console.log('   Chaves do usuário:', diagnostic.userKeysCount);
      console.log('   Tem conta BRL?', diagnostic.hasBRLAccount ? '✅' : '❌');

      // 5. Verificar problemas
      const problems: string[] = [];

      if (!diagnostic.hasEmailKey && userData?.email) {
        problems.push('Chave PIX de EMAIL não foi criada');
      }

      if (!diagnostic.hasPhoneKey && userData?.phone) {
        problems.push('Chave PIX de TELEFONE não foi criada');
      }

      if (diagnostic.hasEmailKey && diagnostic.emailKeyValue !== diagnostic.userEmail) {
        problems.push(`Chave EMAIL desatualizada: "${diagnostic.emailKeyValue}" ≠ "${diagnostic.userEmail}"`);
      }

      if (!diagnostic.hasBRLAccount && userData?.country === 'BR') {
        problems.push('Conta BRL não foi criada (necessária para chaves PIX)');
      }

      console.log('\n⚠️ PROBLEMAS DETECTADOS:');
      if (problems.length === 0) {
        console.log('   ✅ Nenhum problema detectado!');
      } else {
        problems.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p}`);
        });
      }

      console.log('\n🔍 ========================================');

      setResults({
        userData,
        allKeys,
        userKeys,
        accounts,
        diagnostic,
        problems,
      });
    } catch (error) {
      console.error('❌ Erro no diagnóstico:', error);
      alert('Erro ao executar diagnóstico. Verifique o console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-xl font-semibold text-white">🔍 Diagnóstico de Chaves PIX</h2>
            <p className="text-sm text-white/60 mt-1">
              Verificar se suas chaves PIX foram criadas corretamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {!results ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <p className="text-white/60 mb-6">
                Clique no botão abaixo para executar o diagnóstico.
                <br />
                Os resultados aparecerão no console (F12) e aqui.
              </p>
              <button
                onClick={runDiagnostic}
                disabled={loading}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all disabled:opacity-50"
              >
                {loading ? 'Executando...' : 'Executar Diagnóstico'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  📊 Resumo
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-white/60">Email no perfil:</span>
                    <p className="text-white font-mono">{results.diagnostic.userEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Telefone no perfil:</span>
                    <p className="text-white font-mono">{results.diagnostic.userPhone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Chave EMAIL:</span>
                    <p className="text-white font-mono flex items-center gap-2">
                      {results.diagnostic.hasEmailKey ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {results.diagnostic.emailKeyValue}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          Não criada
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-white/60">Chave TELEFONE:</span>
                    <p className="text-white font-mono flex items-center gap-2">
                      {results.diagnostic.hasPhoneKey ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          {results.diagnostic.phoneKeyValue}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-red-500" />
                          Não criada
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Problemas */}
              {results.problems.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Problemas Detectados
                  </h3>
                  <ul className="space-y-2 text-sm text-white/80">
                    {results.problems.map((problem: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-500">•</span>
                        {problem}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Chaves do Usuário */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">
                  🔑 Suas Chaves PIX ({results.userKeys.length})
                </h3>
                {results.userKeys.length === 0 ? (
                  <p className="text-white/60 text-sm">Nenhuma chave encontrada</p>
                ) : (
                  <div className="space-y-2">
                    {results.userKeys.map((key: any, index: number) => (
                      <div
                        key={key.id}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white/60 uppercase text-xs">{key.keyType}</span>
                          <span className="text-white/40 text-xs font-mono">{key.currency}</span>
                        </div>
                        <p className="text-white font-mono">{key.keyValue}</p>
                        <p className="text-white/40 text-xs mt-1">Conta: {key.accountNumber}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Todas as Chaves */}
              <details className="bg-white/5 border border-white/10 rounded-xl p-4">
                <summary className="text-white font-medium cursor-pointer">
                  🌐 Todas as Chaves do Sistema ({results.allKeys.length})
                </summary>
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {results.allKeys.map((key: any, index: number) => (
                    <div
                      key={key.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/60 uppercase text-xs">{key.keyType}</span>
                        <span className={`text-xs ${key.userId === user?.uid ? 'text-green-500' : 'text-white/40'}`}>
                          {key.userId === user?.uid ? 'SUA CHAVE' : 'Outro usuário'}
                        </span>
                      </div>
                      <p className="text-white font-mono text-xs">{key.keyValue}</p>
                      <p className="text-white/40 text-xs mt-1">ID: {key.userId.substring(0, 8)}...</p>
                    </div>
                  ))}
                </div>
              </details>

              {/* Instruções */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h3 className="text-white font-medium mb-2">💡 Próximos Passos</h3>
                <p className="text-white/80 text-sm">
                  Todos os logs detalhados foram enviados para o console (pressione F12).
                  <br />
                  Copie TODOS os logs do console e envie para o desenvolvedor.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white text-sm transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
