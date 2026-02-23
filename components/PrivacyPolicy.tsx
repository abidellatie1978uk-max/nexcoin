import { ArrowLeft } from 'lucide-react';
import type { Screen } from '../App';

interface PrivacyPolicyProps {
  onNavigate: (screen: Screen) => void;
}

export function PrivacyPolicy({ onNavigate }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 sticky top-0 bg-black z-10">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => onNavigate('profile')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Política de Privacidade</h1>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 pb-24 space-y-6">
        <div className="bg-zinc-900 rounded-2xl p-4">
          <p className="text-xs text-gray-400">
            Última atualização: 26 de janeiro de 2026
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">1. Introdução</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            O NexCoin valoriza sua privacidade. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você usa nossos serviços.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Informações que Coletamos</h2>
          <div className="space-y-3 text-sm text-gray-400">
            <div>
              <p className="font-semibold text-white mb-1">2.1 Informações de Cadastro:</p>
              <p className="leading-relaxed">
                • Nome completo, e-mail, número de telefone, país de residência
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">2.2 Informações de Transação:</p>
              <p className="leading-relaxed">
                • Histórico de transações, endereços de carteiras, valores negociados
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">2.3 Informações Técnicas:</p>
              <p className="leading-relaxed">
                • Endereço IP, tipo de dispositivo, sistema operacional, logs de acesso
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-1">2.4 Informações de Verificação:</p>
              <p className="leading-relaxed">
                • Documentos de identificação para conformidade KYC (Know Your Customer)
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Como Usamos suas Informações</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p className="leading-relaxed">
              • Fornecer e melhorar nossos serviços de negociação de criptomoedas
            </p>
            <p className="leading-relaxed">
              • Processar transações e garantir a segurança da sua conta
            </p>
            <p className="leading-relaxed">
              • Cumprir requisitos legais e regulatórios (AML/KYC)
            </p>
            <p className="leading-relaxed">
              • Comunicar sobre atualizações, manutenções e questões de segurança
            </p>
            <p className="leading-relaxed">
              • Prevenir fraudes e atividades suspeitas
            </p>
            <p className="leading-relaxed">
              • Personalizar sua experiência no aplicativo
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">4. Compartilhamento de Informações</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Não vendemos suas informações pessoais. Podemos compartilhar seus dados apenas nas seguintes situações:
          </p>
          <div className="space-y-2 text-sm text-gray-400">
            <p className="leading-relaxed">
              • Com provedores de serviços terceirizados essenciais para operação da plataforma
            </p>
            <p className="leading-relaxed">
              • Quando exigido por lei, ordem judicial ou autoridades regulatórias
            </p>
            <p className="leading-relaxed">
              • Para proteger nossos direitos legais e prevenir fraudes
            </p>
            <p className="leading-relaxed">
              • Com seu consentimento explícito
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Segurança dos Dados</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Implementamos medidas de segurança robustas para proteger suas informações:
          </p>
          <div className="space-y-2 text-sm text-gray-400">
            <p className="leading-relaxed">
              • Criptografia de ponta a ponta para dados sensíveis
            </p>
            <p className="leading-relaxed">
              • Autenticação de dois fatores (2FA)
            </p>
            <p className="leading-relaxed">
              • Armazenamento seguro em servidores com certificação de segurança
            </p>
            <p className="leading-relaxed">
              • Monitoramento contínuo contra acessos não autorizados
            </p>
            <p className="leading-relaxed">
              • Auditorias de segurança regulares
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Retenção de Dados</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Mantemos suas informações pessoais pelo tempo necessário para fornecer nossos serviços e cumprir obrigações legais. Dados de transações são mantidos conforme exigido por regulamentações financeiras.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">7. Seus Direitos</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Você tem os seguintes direitos em relação às suas informações pessoais:
          </p>
          <div className="space-y-2 text-sm text-gray-400">
            <p className="leading-relaxed">
              • Acessar e revisar suas informações pessoais
            </p>
            <p className="leading-relaxed">
              • Solicitar correção de dados incorretos
            </p>
            <p className="leading-relaxed">
              • Solicitar exclusão de dados (sujeito a obrigações legais)
            </p>
            <p className="leading-relaxed">
              • Optar por não receber comunicações de marketing
            </p>
            <p className="leading-relaxed">
              • Portabilidade de dados
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">8. Cookies e Rastreamento</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Usamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso da plataforma e personalizar conteúdo. Você pode gerenciar suas preferências de cookies nas configurações do aplicativo.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">9. Transferências Internacionais</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Seus dados podem ser transferidos e processados em países diferentes do seu país de residência. Garantimos que todas as transferências cumpram as leis de proteção de dados aplicáveis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">10. Menores de Idade</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Nossos serviços não são destinados a menores de 18 anos. Não coletamos intencionalmente informações de menores. Se você acredita que coletamos dados de um menor, entre em contato conosco imediatamente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">11. Alterações na Política</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas através do aplicativo ou e-mail. Recomendamos revisar esta política regularmente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">12. Contato</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus dados, entre em contato através da Central de Ajuda ou envie um e-mail para Suporte.NexCoin@gmail.com.
          </p>
        </section>

        <div className="bg-zinc-900 rounded-2xl p-4 mt-8">
          <p className="text-xs text-gray-400 text-center">
            Ao usar o NexCoin, você concorda com esta Política de Privacidade
          </p>
        </div>
      </div>
    </div>
  );
}
