import { ArrowLeft, Mail, MessageCircle, Clock, User, Send } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { Screen } from '../App';

interface HelpCenterProps {
  onNavigate: (screen: Screen) => void;
}

type HelpView = 'options' | 'email' | 'chat' | 'waiting' | 'chatActive';

export function HelpCenter({ onNavigate }: HelpCenterProps) {
  const [view, setView] = useState<HelpView>('options');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent' | 'system'; text: string; time: string }>>([]);
  const [queuePosition, setQueuePosition] = useState(3);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const faqs = [
    {
      question: 'Como fazer um depósito?',
      answer: 'Para fazer um depósito, vá até a aba "Carteira", selecione a criptomoeda desejada e clique em "Depositar". Você receberá um endereço único para enviar seus fundos. Certifique-se de usar a rede correta para evitar perda de fundos.'
    },
    {
      question: 'Como sacar criptomoedas?',
      answer: 'Na aba "Carteira", selecione a moeda que deseja sacar e clique em "Sacar". Insira o endereço de destino, escolha a rede blockchain e o valor. Confirme a transação com seu código de segurança. O processamento pode levar de alguns minutos a horas dependendo da rede.'
    },
    {
      question: 'Taxas de transação',
      answer: 'As taxas variam de acordo com a criptomoeda e a rede blockchain utilizada. Depósitos são gratuitos. Para saques, as taxas são dinâmicas e baseadas no congestionamento da rede. Você sempre verá a taxa exata antes de confirmar qualquer transação.'
    },
    {
      question: 'Segurança da conta',
      answer: 'Sua segurança é nossa prioridade. Recomendamos ativar a autenticação de dois fatores (2FA), usar senha forte e única, e nunca compartilhar suas credenciais. Todas as transações exigem confirmação adicional e seus fundos são protegidos com criptografia de nível bancário.'
    }
  ];

  const handleSendEmail = () => {
    if (emailSubject && emailMessage) {
      alert('E-mail enviado com sucesso! Nossa equipe responderá em breve.');
      setEmailSubject('');
      setEmailMessage('');
      setView('options');
    }
  };

  const handleStartChat = () => {
    setView('waiting');
    // Simula a fila de atendimento
    setTimeout(() => {
      setQueuePosition(2);
    }, 3000);
    setTimeout(() => {
      setQueuePosition(1);
    }, 6000);
    setTimeout(() => {
      setChatMessages([
        { sender: 'system', text: 'Você foi conectado com um agente', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) },
        { sender: 'agent', text: 'Olá! Sou o agente Carlos. Como posso ajudá-lo hoje?', time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
      ]);
      setView('chatActive');
    }, 9000);
  };

  const handleSendChatMessage = () => {
    if (chatMessage.trim()) {
      const newMessage = {
        sender: 'user' as const,
        text: chatMessage,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages([...chatMessages, newMessage]);
      setChatMessage('');

      // Simula resposta do agente
      setIsTyping(true);
      setTimeout(() => {
        const agentResponse = {
          sender: 'agent' as const,
          text: 'Entendi sua questão. Vou verificar isso para você.',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setChatMessages(prev => [...prev, agentResponse]);
        setIsTyping(false);
      }, 4000);
    }
  };

  const renderOptions = () => (
    <div className="px-6 space-y-4">
      {/* Intro */}
      <div className="bg-zinc-900 rounded-2xl p-4">
        <h2 className="font-semibold mb-2">Como podemos ajudar?</h2>
        <p className="text-sm text-gray-400">
          Escolha a melhor forma de entrar em contato com nossa equipe de suporte
        </p>
      </div>

      {/* Email Option */}
      <button
        onClick={() => setView('email')}
        className="w-full bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-2xl p-4 text-left"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Enviar e-mail</h3>
            <p className="text-sm text-gray-400">
              Envie sua dúvida por e-mail e receba resposta em até 24 horas
            </p>
          </div>
        </div>
      </button>

      {/* Chat Option */}
      <button
        onClick={handleStartChat}
        className="w-full bg-zinc-900 hover:bg-zinc-800 transition-colors rounded-2xl p-4 text-left"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Chat ao vivo</h3>
            <p className="text-sm text-gray-400">
              Converse com um agente em tempo real
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-green-500">Disponível agora</span>
            </div>
          </div>
        </div>
      </button>

      {/* FAQ */}
      <div className="bg-zinc-900 rounded-2xl p-4">
        <h3 className="font-semibold mb-3 text-sm">Perguntas frequentes</h3>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx}>
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors py-2"
              >
                {faq.question}
              </button>
              {expandedFaq === idx && (
                <div className="mt-2 mb-2 bg-black rounded-xl p-3">
                  <p className="text-xs text-gray-400">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEmail = () => (
    <div className="px-6 space-y-4">
      <div className="bg-zinc-900 rounded-2xl p-4">
        <h2 className="font-semibold mb-2">Enviar e-mail</h2>
        <p className="text-sm text-gray-400">
          Preencha os campos abaixo e nossa equipe responderá em breve
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Assunto</label>
          <input
            type="text"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            placeholder="Digite o assunto"
            className="w-full bg-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-2 block">Mensagem</label>
          <textarea
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            placeholder="Descreva sua dúvida ou problema"
            rows={6}
            className="w-full bg-zinc-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setView('options')}
            className="flex-1 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSendEmail}
            disabled={!emailSubject || !emailMessage}
            className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );

  const renderWaiting = () => (
    <div className="px-6">
      <div className="bg-zinc-900 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-green-500 animate-pulse" />
        </div>
        <h2 className="font-semibold mb-2">Aguardando atendimento</h2>
        <p className="text-sm text-gray-400 mb-4">
          Você está na fila. Em breve um agente estará disponível.
        </p>
        <div className="bg-black rounded-xl p-4 mb-4">
          <div className="text-3xl font-bold text-green-500 mb-1">{queuePosition}</div>
          <div className="text-xs text-gray-400">pessoas à sua frente</div>
        </div>
        <button
          onClick={() => setView('options')}
          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  const renderChatActive = () => (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Agent Info */}
      <div className="px-6 pb-4 bg-zinc-900 flex-shrink-0">
        <div className="flex items-center gap-3 py-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">Agente Carlos</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-400">Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 hide-scrollbar min-h-0">
        {chatMessages.map((msg, idx) => (
          <div key={idx}>
            {msg.sender === 'system' ? (
              <div className="text-center">
                <span className="text-xs text-gray-500 bg-zinc-900 px-3 py-1 rounded-full">
                  {msg.text}
                </span>
              </div>
            ) : (
              <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${msg.sender === 'user' ? 'bg-white text-black' : 'bg-zinc-900'} rounded-2xl px-4 py-2.5`}>
                  <p className="text-xs">{msg.text}</p>
                  <span className="text-[10px] opacity-70 mt-1 block">{msg.time}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[75%] bg-zinc-900 rounded-2xl px-4 py-3 flex items-center gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-4 border-t border-zinc-900 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendChatMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-zinc-900 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <button
            onClick={handleSendChatMessage}
            disabled={!chatMessage.trim()}
            className="w-12 h-12 rounded-xl bg-white hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-5 h-5 text-black" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => view === 'options' ? onNavigate('profile') : setView('options')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900 hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Central de Ajuda</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 pb-24">
        {view === 'options' && renderOptions()}
        {view === 'email' && renderEmail()}
        {view === 'waiting' && renderWaiting()}
        {view === 'chatActive' && renderChatActive()}
      </div>
    </div>
  );
}