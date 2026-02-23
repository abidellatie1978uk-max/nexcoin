import { useState } from 'react';
import { X, CreditCard, Shield, Lock, Unlock, Ban, Check, ChevronRight, Wifi, Loader2, Plus, Info } from 'lucide-react';
import { useCards, CARD_PLANS, UserCard, CardPlan } from '../hooks/useCards';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import type { Screen } from '../App';

interface CardsProps {
    onNavigate: (screen: Screen) => void;
}

// ─── Card Visual ──────────────────────────────────────────────────────────────

const CARD_GRADIENTS: Record<string, string> = {
    black: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #111 100%)',
    gold: 'linear-gradient(135deg, #b8860b 0%, #daa520 40%, #b8860b 100%)',
    platinum: 'linear-gradient(135deg, #71797e 0%, #a9a9a9 40%, #71797e 100%)',
    blue: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%)',
};

function CreditCardVisual({ card, small = false }: { card: UserCard; small?: boolean }) {
    const { t } = useLanguage();
    const isBlocked = card.isBlocked || card.status === 'blocked';
    const isPending = card.status === 'pending';
    const gradient = CARD_GRADIENTS[card.plan.color] ?? CARD_GRADIENTS.black;
    const size = small ? 'w-full aspect-[1.586/1] max-w-[240px]' : 'w-full aspect-[1.586/1]';

    return (
        <div
            className={`${size} rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between select-none shadow-2xl transition-transform active:scale-[0.98]`}
            style={{
                background: gradient,
                boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)'
            }}
        >
            {/* Status Overlay */}
            {(isBlocked || isPending) && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                            {isPending
                                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                                : <Lock className="w-6 h-6 text-white" />
                            }
                        </div>
                        <span className="text-white text-xs font-bold uppercase tracking-widest">
                            {isPending ? t.cards.processingLabel : t.cards.blockedLabel}
                        </span>
                    </div>
                </div>
            )}

            {/* Glassmorphism overlays */}
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-white/5 blur-3xl pointer-events-none" />

            {/* Top row */}
            <div className="flex items-center justify-between relative z-[1]">
                <div className="flex flex-col">
                    <span className="text-white/40 text-[10px] uppercase font-bold tracking-[2px]">NexCoin</span>
                    <span className="text-white font-bold text-base">{card.plan.name}</span>
                </div>
                {card.type === 'physical' ? (
                    <Wifi className="w-5 h-5 text-white/40 rotate-90" />
                ) : (
                    <div className="px-2 py-0.5 rounded-md border border-white/20 bg-white/5 backdrop-blur-md">
                        <span className="text-[9px] text-white/60 font-bold uppercase">{t.cards.virtual}</span>
                    </div>
                )}
            </div>

            {/* Chip / Brand */}
            <div className="flex items-center justify-between relative z-[1]">
                {card.type === 'physical' ? (
                    <div className="w-11 h-8 rounded-md relative overflow-hidden group shadow-md"
                        style={{ background: 'linear-gradient(135deg, #ffd700, #b8860b)' }}>
                        <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#000_2px,#000_4px)]" />
                        <div className="absolute inset-0 opacity-30 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_2px,#000_4px)]" />
                    </div>
                ) : (
                    <Shield className="w-8 h-8 text-white/20" />
                )}
            </div>

            {/* Bottom info */}
            <div className="flex items-end justify-between relative z-[1]">
                <div className="flex-1">
                    <div className="text-white text-lg font-mono tracking-[3px] mb-1">
                        •••• •••• •••• {card.lastFour}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[7px] text-white/40 uppercase font-black">Validade</span>
                            <span className="text-white text-[10px] font-mono">
                                {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[7px] text-white/40 uppercase font-black">Titular</span>
                            <span className="text-white text-[10px] font-mono truncate max-w-[120px]">
                                {card.cardHolder}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    {card.network === 'Visa' ? (
                        <div className="text-white flex flex-col items-center leading-none">
                            <span className="text-xl font-black italic tracking-tighter" style={{ fontFamily: 'serif' }}>VISA</span>
                            <span className="text-[7px] font-bold uppercase opacity-60">Platinum</span>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-[#eb001b]/90 border border-white/10" />
                            <div className="w-7 h-7 rounded-full bg-[#f79e1b]/90 border border-white/10 -ml-3" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Componente de Opção de Plano ──────────────────────────────────────────

function PlanOption({ plan, onSelect }: { plan: CardPlan, onSelect: (p: CardPlan) => void }) {
    const { t } = useLanguage();
    const planColors: Record<string, string> = {
        black: 'from-neutral-800 to-neutral-900',
        gold: 'from-yellow-700 to-yellow-900',
        platinum: 'from-slate-500 to-slate-700',
        blue: 'from-blue-700 to-blue-900',
    };

    return (
        <button
            onClick={() => onSelect(plan)}
            className="w-full text-left rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-white/20 active:scale-[0.98] transition-all group"
        >
            <div className={`bg-gradient-to-r ${planColors[plan.color]} px-5 py-3 flex items-center justify-between`}>
                <div>
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">
                        {plan.type === 'virtual' ? 'Virtual' : 'Físico'}
                    </span>
                    <h4 className="text-white font-bold text-base leading-none">{plan.name}</h4>
                </div>
                <div className="bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                    {plan.monthlyFee === 0 ? (
                        <span className="text-green-400 font-bold text-xs">{t.cards.free}</span>
                    ) : (
                        <span className="text-white font-bold text-xs">R$ {plan.monthlyFee}</span>
                    )}
                </div>
            </div>
            <div className="p-4">
                <p className="text-white/60 text-xs mb-3 font-light leading-relaxed">{plan.description}</p>
                <div className="flex flex-wrap gap-2">
                    {plan.features.slice(0, 3).map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                            <Check className="w-3 h-3 text-green-500" />
                            <span className="text-[10px] text-white/70">{f}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">{plan.network}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white font-semibold text-xs">
                        {t.cards.orderNow} <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </div>
        </button>
    );
}

// ─── Modal de confirmação ──────────────────────────────────────────────────────

function ConfirmPlanModal({
    plan, onConfirm, onCancel, loading
}: {
    plan: CardPlan;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) {
    const { t } = useLanguage();
    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center px-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onCancel} />
            <div className="relative w-full max-w-md bg-[#0D0D0D] rounded-t-[40px] p-8 pb-12 border-t border-white/20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-xl">{t.cards.confirmOrder}</h2>
                        <p className="text-white/40 text-sm">{t.cards.validatingRequest}</p>
                    </div>
                </div>

                <div className="bg-white/5 rounded-3xl p-5 mb-8 space-y-4 border border-white/10">
                    <div className="flex justify-between items-center group">
                        <span className="text-white/40 text-sm">{t.cards.selectedPlan}</span>
                        <span className="text-white font-bold">{plan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-white/40 text-sm">{t.cards.category}</span>
                        <span className="text-white font-medium flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${plan.type === 'virtual' ? 'bg-cyan-400' : 'bg-purple-400'}`} />
                            {plan.type === 'virtual' ? t.cards.virtual : t.cards.physical}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-white/40 text-sm">{t.cards.monthlyFee}</span>
                        <span className={plan.monthlyFee === 0 ? 'text-green-400 font-black' : 'text-white font-bold'}>
                            {plan.monthlyFee === 0 ? t.cards.exempt : `R$ ${plan.monthlyFee.toFixed(2).replace('.', ',')}`}
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="w-full py-5 rounded-2xl bg-white text-black font-black text-base shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                        {loading ? 'Processando pedido...' : t.cards.confirmAndOrder}
                    </button>
                    <button onClick={onCancel} className="w-full py-2 text-white/30 text-sm font-bold uppercase tracking-widest">
                        {t.cards.cancel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Detalhe de cartão ─────────────────────────────────────────────────────────

function CardDetailModal({
    card, onClose, onToggleBlock, onCancel
}: {
    card: UserCard;
    onClose: () => void;
    onToggleBlock: (id: string, block: boolean) => Promise<void>;
    onCancel: (id: string) => Promise<void>;
}) {
    const { t } = useLanguage();
    const [blockLoading, setBlockLoading] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(false);

    const handleBlock = async () => {
        setBlockLoading(true);
        try {
            await onToggleBlock(card.id, !card.isBlocked);
            toast.success(card.isBlocked ? t.cards.successVirtual : t.cards.blockedLabel);
        } finally { setBlockLoading(false); }
    };

    const handleCancel = async () => {
        await onCancel(card.id);
        toast.success('Cartão cancelado');
        onClose();
    };

    const statusLabel: Record<string, string> = {
        active: 'Ativo',
        blocked: 'Bloqueado',
        cancelled: 'Cancelado',
        pending: 'Processando',
    };
    const statusColor: Record<string, string> = {
        active: 'bg-green-500/10 text-green-400 border-green-500/20',
        blocked: 'bg-red-500/10 text-red-400 border-red-500/20',
        cancelled: 'bg-white/5 text-white/30 border-white/10',
        pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    };

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col">
            {/* Header */}
            <div className="px-5 pt-12 pb-4 flex items-center justify-between border-b border-white/5 bg-[#050505]">
                <button onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                    <ChevronRight className="w-6 h-6 text-white rotate-180" />
                </button>
                <div className="flex flex-col items-center">
                    <span className="text-white font-bold text-sm">{card.plan.name}</span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border mt-1 ${statusColor[card.status]}`}>
                        {statusLabel[card.status]}
                    </span>
                </div>
                <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">
                {/* Visual */}
                <div className="mt-4">
                    <CreditCardVisual card={card} />
                </div>

                {/* Dados */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <Info className="w-4 h-4 text-white/30" />
                        <span className="text-white/30 text-xs font-bold uppercase tracking-widest">{t.cards.information}</span>
                    </div>
                    <div className="bg-[#0D0D0D] rounded-3xl p-6 space-y-5 border border-white/10">
                        <div className="flex justify-between items-center group">
                            <span className="text-white/40 text-xs uppercase font-bold tracking-wider">{t.cards.cardNumber}</span>
                            <span className="text-white font-mono text-sm tracking-widest">•••• •••• •••• {card.lastFour}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white/40 text-xs uppercase font-bold tracking-wider">{t.cards.expiry}</span>
                            <span className="text-white font-mono text-sm">
                                {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white/40 text-xs uppercase font-bold tracking-wider">{t.cards.modality}</span>
                            <span className="text-white font-bold text-sm tracking-wide">
                                {card.type === 'virtual' ? t.cards.virtual : t.cards.physical}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-white/40 text-xs uppercase font-bold tracking-wider">Bandeira</span>
                            <span className="text-white font-bold text-sm">{card.network}</span>
                        </div>
                    </div>
                </div>

                {/* Ações */}
                {card.status !== 'cancelled' && (
                    <div className="space-y-3">
                        <button
                            onClick={handleBlock}
                            disabled={blockLoading || card.status === 'pending'}
                            className={`w-full flex items-center justify-between p-5 rounded-3xl border transition-all active:scale-[0.98] ${card.isBlocked
                                ? 'bg-green-500/5 border-green-500/20'
                                : 'bg-white/5 border-white/10'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${card.isBlocked ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                                    {card.isBlocked ? <Unlock className="w-5 h-5 text-green-400" /> : <Lock className="w-5 h-5 text-yellow-400" />}
                                </div>
                                <div className="text-left">
                                    <span className="text-white font-bold text-sm block">
                                        {card.isBlocked ? t.cards.unblock : t.cards.blockTemporarily}
                                    </span>
                                    <span className="text-white/30 text-[10px] font-medium">{t.cards.blockDesc}</span>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/20" />
                        </button>

                        <button
                            onClick={() => setCancelConfirm(true)}
                            className="w-full flex items-center justify-between p-5 rounded-3xl bg-red-500/5 border border-red-500/20 transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-red-500/20 flex items-center justify-center">
                                    <Ban className="w-5 h-5 text-red-500" />
                                </div>
                                <div className="text-left">
                                    <span className="text-red-500 font-bold text-sm block">{t.cards.cancelAndExcl}</span>
                                    <span className="text-red-500/40 text-[10px] font-medium">{t.cards.irreversible}</span>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-red-500/20" />
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de confirmação de cancelamento */}
            {cancelConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setCancelConfirm(false)} />
                    <div className="relative w-full max-w-sm bg-[#0D0D0D] rounded-[40px] p-8 border border-white/10 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <Ban className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-white font-black text-xl mb-3">{t.cards.confirmCancel}</h2>
                        <p className="text-white/40 text-sm mb-8 leading-relaxed">
                            {t.cards.cancelWarning}
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={handleCancel}
                                className="w-full py-4 rounded-2xl bg-red-500 text-white font-black text-sm uppercase tracking-widest active:scale-[0.98] transition-all"
                            >
                                {t.cards.confirmCancel}
                            </button>
                            <button
                                onClick={() => setCancelConfirm(false)}
                                className="w-full py-3 text-white/30 text-xs font-bold uppercase tracking-widest"
                            >
                                {t.cards.back}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Tela principal ───────────────────────────────────────────────────────────

export function Cards({ onNavigate }: CardsProps) {
    const { t } = useLanguage();
    const { cards, loading, requestCard, toggleBlock, cancelCard } = useCards();
    const [showPlans, setShowPlans] = useState(false);
    const [confirmPlan, setConfirmPlan] = useState<CardPlan | null>(null);
    const [requesting, setRequesting] = useState(false);
    const [selectedCard, setSelectedCard] = useState<UserCard | null>(null);

    const activeCards = cards.filter(c => c.status === 'active' || c.status === 'blocked' || c.status === 'pending');

    const handleSelectPlan = (plan: CardPlan) => {
        setConfirmPlan(plan);
    };

    const handleConfirmRequest = async () => {
        if (!confirmPlan) return;
        setRequesting(true);
        try {
            await requestCard(confirmPlan);
            setConfirmPlan(null);
            setShowPlans(false);
            toast.success(
                confirmPlan.type === 'virtual'
                    ? t.cards.successVirtual
                    : t.cards.successPhysical
            );
        } catch (e) {
            toast.error(t.cards.errorRequest);
        } finally {
            setRequesting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col pb-28">
            {/* Background Blur Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-40 left-0 w-64 h-64 bg-purple-500/10 blur-[120px] pointer-events-none" />

            {/* Header */}
            <div className="px-6 pt-12 pb-6 flex items-center justify-between relative z-10">
                <div>
                    <h1 className="text-white font-black text-2xl tracking-tight">{t.cards.title}</h1>
                    <p className="text-white/40 text-xs font-medium">{t.cards.subtitle}</p>
                </div>
                {activeCards.length > 0 && (
                    <button
                        onClick={() => setShowPlans(true)}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-95 transition-all"
                    >
                        <Plus className="w-6 h-6 text-white" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 relative z-10 hide-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <div className="w-12 h-12 rounded-2xl border-2 border-white/10 border-t-white animate-spin" />
                        <span className="text-white/20 text-xs font-black uppercase tracking-widest">Sincronizando...</span>
                    </div>
                ) : activeCards.length === 0 ? (
                    /* ── Estado Vazio: Mostrar planos diretamente ── */
                    <div className="space-y-8 py-4">
                        <div className="text-center space-y-2 mb-4">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <CreditCard className="w-8 h-8 text-white/20" />
                            </div>
                            <h2 className="text-white font-bold text-xl">{t.cards.noActiveCards}</h2>
                            <p className="text-white/40 text-sm max-w-[240px] mx-auto">
                                {t.cards.choosePlan}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-px bg-white/10 flex-1" />
                                <span className="text-[10px] text-white/30 font-black uppercase tracking-[3px]">Planos Disponíveis</span>
                                <div className="h-px bg-white/10 flex-1" />
                            </div>
                            {CARD_PLANS.map(plan => (
                                <PlanOption key={plan.id} plan={plan} onSelect={handleSelectPlan} />
                            ))}
                        </div>
                    </div>
                ) : (
                    /* ── Lista de Cartões Ativos ── */
                    <div className="space-y-6 py-4">
                        {activeCards.map(card => (
                            <div key={card.id} className="space-y-3">
                                <button
                                    onClick={() => setSelectedCard(card)}
                                    className="w-full text-left"
                                >
                                    <CreditCardVisual card={card} />
                                </button>
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${card.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">{card.plan.name}</span>
                                    </div>
                                    <button
                                        onClick={() => setSelectedCard(card)}
                                        className="text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                                    >
                                        Gerenciar
                                    </button>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={() => setShowPlans(true)}
                            className="w-full py-6 rounded-3xl border-2 border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-2 group mt-8"
                        >
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-white/40 group-hover:text-white" />
                            </div>
                            <span className="text-white/30 text-xs font-black uppercase tracking-widest group-hover:text-white/60">{t.cards.requestNew}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Modal de Seleção de Planos (Sempre que quiser adicionar mais um) */}
            {showPlans && (
                <div className="fixed inset-0 z-[120] bg-black overflow-y-auto pb-20">
                    <div className="px-6 pt-12 pb-4 flex items-center justify-between sticky top-0 bg-black/90 backdrop-blur-md z-10">
                        <h2 className="text-white font-black text-xl">Solicitar Cartão</h2>
                        <button onClick={() => setShowPlans(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        {CARD_PLANS.map(plan => (
                            <PlanOption key={plan.id} plan={plan} onSelect={handleSelectPlan} />
                        ))}
                    </div>
                </div>
            )}

            {/* Confirmação */}
            {confirmPlan && (
                <ConfirmPlanModal
                    plan={confirmPlan}
                    onConfirm={handleConfirmRequest}
                    onCancel={() => setConfirmPlan(null)}
                    loading={requesting}
                />
            )}

            {/* Detalhe do cartão */}
            {selectedCard && (
                <CardDetailModal
                    card={selectedCard}
                    onClose={() => setSelectedCard(null)}
                    onToggleBlock={toggleBlock}
                    onCancel={cancelCard}
                />
            )}
        </div>
    );
}
