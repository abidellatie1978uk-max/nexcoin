import { useState, useEffect } from 'react';
import {
    collection, doc, addDoc, onSnapshot,
    query, where, serverTimestamp, updateDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CardType = 'virtual' | 'physical';
export type CardStatus = 'active' | 'blocked' | 'cancelled' | 'pending';

export type CardPlan = {
    id: string;
    name: string;
    type: CardType;
    description: string;
    features: string[];
    monthlyFee: number;      // 0 = grátis
    currency: 'BRL' | 'USD' | 'EUR' | 'GBP';
    color: 'black' | 'gold' | 'platinum' | 'blue';
    network: 'Visa' | 'Mastercard';
};

export type UserCard = {
    id: string;
    userId: string;
    planId: string;
    type: CardType;
    status: CardStatus;
    lastFour: string;       // últimos 4 dígitos fictícios
    cardHolder: string;
    expiryMonth: number;
    expiryYear: number;
    network: 'Visa' | 'Mastercard';
    plan: CardPlan;
    createdAt: Date;
    isBlocked: boolean;
};

// ─── Planos disponíveis ────────────────────────────────────────────────────────

export const CARD_PLANS: CardPlan[] = [
    {
        id: 'virtual-standard',
        name: 'Virtual Standard',
        type: 'virtual',
        description: 'Cartão virtual para compras online. Gratuito.',
        features: [
            'Compras online ilimitadas',
            'Disponível imediatamente',
            'Número único por compra',
            'Sem anuidade',
        ],
        monthlyFee: 0,
        currency: 'BRL',
        color: 'black',
        network: 'Visa',
    },
    {
        id: 'physical-standard',
        name: 'Physical Black',
        type: 'physical',
        description: 'Cartão físico com chip e NFC para uso no dia a dia.',
        features: [
            'Chip + NFC contactless',
            'Saques em caixas eletrônicos',
            'Compras em lojas físicas',
            'Entrega em até 10 dias úteis',
            'Sem anuidade no 1° ano',
        ],
        monthlyFee: 0,
        currency: 'BRL',
        color: 'black',
        network: 'Mastercard',
    },
    {
        id: 'physical-gold',
        name: 'Physical Gold',
        type: 'physical',
        description: 'Cartão Gold com benefícios exclusivos e maior limite.',
        features: [
            'Tudo do Physical Black',
            'Limite maior',
            'Seguro viagem incluído',
            'Acesso a salas VIP nos aeroportos',
            'Concierge 24h',
        ],
        monthlyFee: 39.90,
        currency: 'BRL',
        color: 'gold',
        network: 'Visa',
    },
    {
        id: 'physical-platinum',
        name: 'Platinum',
        type: 'physical',
        description: 'O topo da linha — benefícios premium globais.',
        features: [
            'Tudo do Gold',
            'Limite ilimitado',
            'Cashback de 1.5%',
            'Priority Pass (acesso a 1400 salas VIP)',
            'Seguro completo para compras',
        ],
        monthlyFee: 149.90,
        currency: 'BRL',
        color: 'platinum',
        network: 'Mastercard',
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateLastFour(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateExpiry() {
    const now = new Date();
    return {
        month: now.getMonth() + 1,
        year: now.getFullYear() + 4,
    };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCards() {
    const { user, userData } = useAuth();
    const [cards, setCards] = useState<UserCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) { setLoading(false); return; }

        const q = query(
            collection(db, 'cards'),
            where('userId', '==', user.uid)
        );

        const unsub = onSnapshot(q, (snap) => {
            const list: UserCard[] = snap.docs.map(d => {
                const data = d.data();
                return {
                    id: d.id,
                    ...data,
                    createdAt: data.createdAt?.toDate?.() ?? new Date(),
                } as UserCard;
            });
            setCards(list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
            setLoading(false);
        });

        return unsub;
    }, [user?.uid]);

    // Solicitar / criar cartão
    const requestCard = async (plan: CardPlan): Promise<void> => {
        if (!user?.uid || !userData) throw new Error('Usuário não autenticado');

        const expiry = generateExpiry();
        const newCard = {
            userId: user.uid,
            planId: plan.id,
            type: plan.type,
            status: plan.type === 'virtual' ? 'active' : 'pending', // físico fica pendente até ser enviado
            lastFour: generateLastFour(),
            cardHolder: (userData.name || userData.displayName || 'CARD HOLDER').toUpperCase(),
            expiryMonth: expiry.month,
            expiryYear: expiry.year,
            network: plan.network,
            plan: plan,
            isBlocked: false,
            createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'cards'), newCard);
    };

    // Bloquear / desbloquear
    const toggleBlock = async (cardId: string, block: boolean): Promise<void> => {
        await updateDoc(doc(db, 'cards', cardId), {
            isBlocked: block,
            status: block ? 'blocked' : 'active',
        });
    };

    // Cancelar cartão
    const cancelCard = async (cardId: string): Promise<void> => {
        await updateDoc(doc(db, 'cards', cardId), {
            status: 'cancelled',
        });
    };

    return { cards, loading, requestCard, toggleBlock, cancelCard };
}
