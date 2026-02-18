import { ArrowLeft } from 'lucide-react';
import type { Screen } from '../App';

interface TermsAndConditionsProps {
  onNavigate: (screen: Screen) => void;
}

export function TermsAndConditions({ onNavigate }: TermsAndConditionsProps) {
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
          <h1 className="text-xl font-bold">Termos de Uso</h1>
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
          <h2 className="text-lg font-semibold">1. Aceitação dos Termos</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Ao usar o Ethertron, você concorda em cumprir estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">2. Elegibilidade</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Você deve ter pelo menos 18 anos de idade para usar o Ethertron. Ao criar uma conta, você declara e garante que tem capacidade legal para celebrar este contrato.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">3. Conta e Segurança</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p className="leading-relaxed">
              • Você é responsável por manter a confidencialidade de suas credenciais de login
            </p>
            <p className="leading-relaxed">
              • Você deve notificar imediatamente sobre qualquer uso não autorizado de sua conta
            </p>
            <p className="leading-relaxed">
              • O Ethertron não será responsável por perdas decorrentes do uso não autorizado de sua conta
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">4. Uso da Plataforma</h2>
          <div className="space-y-2 text-sm text-gray-400">
            <p className="leading-relaxed">
              <strong className="text-white">Uso Permitido:</strong> O Ethertron é uma plataforma para negociação de criptomoedas. Você concorda em usar a plataforma apenas para fins legais.
            </p>
            <p className="leading-relaxed">
              <strong className="text-white">Uso Proibido:</strong> É proibido usar a plataforma para lavagem de dinheiro, financiamento de terrorismo, fraude ou qualquer atividade ilegal.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">5. Transações e Taxas</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Todas as transações realizadas através do Ethertron estão sujeitas a taxas de rede. As taxas são claramente exibidas antes da confirmação de qualquer transação. Uma vez confirmada, a transação é irreversível.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">6. Riscos de Criptomoedas</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Você reconhece que o mercado de criptomoedas é volátil e que o valor dos seus ativos pode flutuar significativamente. O Ethertron não garante lucros e você é responsável por suas decisões de investimento.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">7. Limitação de Responsabilidade</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            O Ethertron não será responsável por perdas diretas, indiretas, incidentais ou consequenciais resultantes do uso ou incapacidade de usar nossos serviços, incluindo perda de fundos, dados ou lucros.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">8. Suspensão e Encerramento</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Reservamo-nos o direito de suspender ou encerrar sua conta a qualquer momento, sem aviso prévio, se acreditarmos que você violou estes termos ou se envolveu em atividades fraudulentas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">9. Modificações dos Termos</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Podemos modificar estes termos a qualquer momento. Notificaremos você sobre mudanças significativas através do aplicativo ou e-mail. O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">10. Lei Aplicável</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Estes termos são regidos pelas leis aplicáveis em sua jurisdição. Qualquer disputa será resolvida nos tribunais competentes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">11. Contato</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco através da Central de Ajuda.
          </p>
        </section>

        <div className="bg-zinc-900 rounded-2xl p-4 mt-8">
          <p className="text-xs text-gray-400 text-center">
            Ao usar o Ethertron, você concorda com estes Termos de Uso
          </p>
        </div>
      </div>
    </div>
  );
}
