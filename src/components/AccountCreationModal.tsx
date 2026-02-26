import { CheckCircle2, Loader2, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

interface AccountCreationModalProps {
  isOpen: boolean;
  countryName: string;
  onComplete: () => void;
}

const steps = [
  { id: 1, label: 'Validando dados', duration: 1500 },
  { id: 2, label: 'Gerando número da conta', duration: 2000 },
  { id: 3, label: 'Configurando segurança', duration: 1800 },
  { id: 4, label: 'Finalizando abertura', duration: 1500 },
];

export function AccountCreationModal({ isOpen, countryName, onComplete }: AccountCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    
    const processSteps = async () => {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        
        await new Promise(resolve => {
          timeoutId = setTimeout(resolve, steps[i].duration);
        });
        
        setCompletedSteps(prev => [...prev, i]);
      }
      
      // Pequena pausa antes de completar
      await new Promise(resolve => {
        timeoutId = setTimeout(resolve, 500);
      });
      
      onComplete();
    };

    processSteps();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 40 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-zinc-900/95 backdrop-blur-xl rounded-3xl p-10 w-full max-w-md border border-white/20 shadow-[0_20px_100px_rgba(0,0,0,0.9)]"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center border border-white/20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-8 h-8 text-white" />
              </motion.div>
            </div>
            <h3 className="text-xl text-white mb-2">Abrindo Conta</h3>
            <p className="text-sm text-white/60">
              Configurando sua conta de {countryName}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4">
                {/* Step indicator */}
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep > index
                      ? 'bg-green-500/20 border-2 border-green-500'
                      : currentStep === index
                      ? 'bg-white/20 border-2 border-white animate-pulse'
                      : 'bg-white/5 border-2 border-white/20'
                  }`}
                >
                  {currentStep > index ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <span className="text-sm text-white">{index + 1}</span>
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1">
                  <p
                    className={`text-sm transition-all ${
                      currentStep > index
                        ? 'text-green-400' 
                        : currentStep === index
                        ? 'text-white'
                        : 'text-white/40'
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-white/40">
              {completedSteps.length} de {steps.length} etapas concluídas
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}