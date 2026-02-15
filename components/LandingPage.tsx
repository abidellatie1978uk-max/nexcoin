import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Shield, Globe, TrendingUp, CreditCard, Lock, Zap, ArrowRight, Menu, X, Instagram, Twitter, Facebook, Youtube, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Screen } from '../App';
import { useLanguage } from '../contexts/LanguageContext';
import { CryptoIcon } from './CryptoIcon';

interface LandingPageProps {
    onNavigate: (screen: Screen) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { language, setLanguage, t } = useLanguage();

    const [isTransitioning, setIsTransitioning] = useState(false);

    const handleLanguageChange = async (lang: any) => {
        if (lang === language) return;
        setIsTransitioning(true);
        setTimeout(async () => {
            await setLanguage(lang);
            setIsTransitioning(false);
        }, 150); // Reduzido para 150ms para ser mais rápido
    };

    // Garantir que o body possa rolar
    useEffect(() => {
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.documentElement.style.height = 'auto';

        return () => {
            document.body.style.overflow = '';
            document.body.style.height = '';
            document.documentElement.style.overflow = '';
            document.documentElement.style.height = '';
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const fadeInVariants = {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 }
    };

    const fadeInProps: any = {
        initial: "initial",
        whileInView: "whileInView",
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.8, ease: "easeOut" }
    };

    const staggerVariants = {
        initial: {},
        whileInView: {
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const staggerProps: any = {
        initial: "initial",
        whileInView: "whileInView",
        viewport: { once: true, amount: 0.1 }
    };

    return (
        <div
            className="bg-white text-black font-sans selection:bg-blue-100 w-full h-auto"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch'
            }}
        >
            <div className={`transition-opacity duration-200 ease-linear ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                {/* Navbar */}
                <nav className={`sticky top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-100 py-3' : 'bg-white py-5'}`}>
                    <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                        <div className="flex items-center gap-12">
                            <h1 className="text-2xl font-black italic tracking-tighter text-black">NexCoin</h1>
                            <div className="hidden lg:flex gap-8 text-sm font-semibold text-gray-600">
                                <a href="#" className="hover:text-black transition-colors">{t.landingPage.products}</a>
                                <a href="#" className="hover:text-black transition-colors">{t.landingPage.company}</a>
                                <a href="#" className="hover:text-black transition-colors">{t.landingPage.help}</a>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <button className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-black transition-colors px-3 py-2 rounded-lg hover:bg-gray-50">
                                    <Globe className="w-4 h-4" />
                                    <span className="uppercase">{language}</span>
                                </button>
                                <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
                                    <button onClick={() => handleLanguageChange('pt')} className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-gray-50 first:rounded-t-xl transition-colors">Português</button>
                                    <button onClick={() => handleLanguageChange('en')} className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition-colors">English</button>
                                    <button onClick={() => handleLanguageChange('es')} className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-gray-50 last:rounded-b-xl transition-colors">Español</button>
                                </div>
                            </div>
                            <button
                                onClick={() => onNavigate('signup')}
                                className="bg-black text-white px-6 py-2 rounded-full font-bold hover:bg-zinc-900 transition-colors"
                            >
                                {t.landingPage.openAccount}
                            </button>
                            <button className="lg:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Menu */}
                    <AnimatePresence>
                        {isMobileMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="lg:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-gray-100 overflow-hidden shadow-2xl z-50"
                            >
                                <div className="p-8 flex flex-col gap-8">
                                    <div className="flex flex-col gap-6">
                                        <a href="#" className="flex items-center justify-between text-xl font-bold text-gray-900 group">
                                            {t.landingPage.products}
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
                                        </a>
                                        <a href="#" className="flex items-center justify-between text-xl font-bold text-gray-900 group">
                                            {t.landingPage.company}
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
                                        </a>
                                        <a href="#" className="flex items-center justify-between text-xl font-bold text-gray-900 group">
                                            {t.landingPage.help}
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
                                        </a>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <button
                                            onClick={() => {
                                                onNavigate('signup');
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-black/10 active:scale-95 transition-all"
                                        >
                                            {t.landingPage.openAccount}
                                        </button>
                                        <button
                                            onClick={() => {
                                                onNavigate('login');
                                                setIsMobileMenuOpen(false);
                                            }}
                                            className="w-full bg-gray-50 text-gray-900 py-5 rounded-2xl font-bold text-lg border border-gray-100 active:scale-95 transition-all"
                                        >
                                            {t.login}
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.language}</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { handleLanguageChange('pt'); setIsMobileMenuOpen(false); }}
                                                className={`flex-1 py-3 rounded-xl font-bold border transition-all ${language === 'pt' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-600'}`}
                                            >
                                                PT
                                            </button>
                                            <button
                                                onClick={() => { handleLanguageChange('en'); setIsMobileMenuOpen(false); }}
                                                className={`flex-1 py-3 rounded-xl font-bold border transition-all ${language === 'en' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-600'}`}
                                            >
                                                EN
                                            </button>
                                            <button
                                                onClick={() => { handleLanguageChange('es'); setIsMobileMenuOpen(false); }}
                                                className={`flex-1 py-3 rounded-xl font-bold border transition-all ${language === 'es' ? 'bg-black text-white border-black' : 'bg-white border-gray-100 text-gray-600'}`}
                                            >
                                                ES
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </nav>

                {/* Hero Section */}
                <section className="relative pt-12 pb-16 lg:pt-32 lg:pb-32">
                    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 items-center gap-12 lg:gap-20">
                        <div className="z-10 text-center lg:text-left">
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                                className="text-4xl sm:text-5xl lg:text-7xl font-black leading-[1.1] mb-6 lg:mb-8 tracking-tighter"
                            >
                                {t.landingPage.moreThanGlobalTitle} <span className="text-blue-600 space-x-2">{t.landingPage.moreThanGlobalHighlight}</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="text-lg lg:text-xl text-gray-600 mb-8 lg:mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed"
                            >
                                {t.landingPage.heroSubtitle}
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4"
                            >
                                <button
                                    onClick={() => onNavigate('signup')}
                                    className="bg-black text-white px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform"
                                >
                                    {t.landingPage.openAccount}
                                </button>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, rotate: 2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 1.2, ease: "easeOut" }}
                            className="relative mt-12 lg:mt-0"
                        >
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto">
                                <img
                                    src="https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=2070&auto=format&fit=crop"
                                    alt="Fintech experience"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-[280px] lg:w-64 p-4 lg:p-6 bg-white/30 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl">
                                    <p className="text-[10px] lg:text-xs font-bold text-white/80 uppercase mb-1">{t.landingPage.yourBalance}</p>
                                    <p className="text-3xl lg:text-4xl font-black text-white mb-4">
                                        {language === 'pt' ? 'R$ 42.084' : language === 'en' ? '$ 42,084' : '€ 42.084'}
                                    </p>
                                    <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-white/20">
                                        <div className="w-6 h-6 lg:w-8 lg:h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <TrendingUp size={14} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[8px] lg:text-[10px] font-bold text-white/60">{t.landingPage.yield}</p>
                                            <p className="text-[10px] lg:text-xs font-bold text-white">{t.landingPage.yieldToday}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Social Proof */}
                <motion.section
                    {...staggerProps}
                    variants={staggerVariants}
                    className="py-8 lg:py-12 border-y border-gray-100"
                >
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <motion.p variants={fadeInVariants} className="text-gray-400 font-bold text-[10px] lg:text-sm uppercase tracking-widest mb-6 lg:mb-10">{t.landingPage.socialProof}</motion.p>
                        <motion.div variants={fadeInVariants} className="flex flex-wrap justify-center items-center gap-6 lg:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="text-lg lg:text-2xl font-black text-gray-800">FAST COMPANY</div>
                            <div className="text-lg lg:text-2xl font-black text-gray-800">TECHCRUNCH</div>
                            <div className="text-lg lg:text-2xl font-black text-gray-800">FINTECH INSIDER</div>
                            <div className="text-lg lg:text-2xl font-black text-gray-800">FORBES</div>
                        </motion.div>
                    </div>
                </motion.section>

                {/* Feature 1: Spend */}
                <section className="py-20 lg:py-24 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-6 text-center mb-2">
                        <motion.h2 {...fadeInProps} variants={fadeInVariants} className="text-3xl lg:text-6xl font-black tracking-tighter mb-6">{t.landingPage.elevateSpending}</motion.h2>
                        <motion.p {...fadeInProps} variants={fadeInVariants} className="text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">{t.landingPage.cardSubtitle}</motion.p>
                        <motion.button
                            onClick={() => onNavigate('signup')}
                            {...fadeInProps}
                            variants={fadeInVariants}
                            className="mt-8 lg:mt-10 bg-black text-white px-8 py-3 rounded-full font-bold"
                        >
                            {t.landingPage.requestCard}
                        </motion.button>
                    </div>

                    <div className="relative min-h-[500px] lg:min-h-[700px] flex justify-center items-center py-12 bg-zinc-50/50 overflow-visible perspective-2000">
                        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 px-6 items-start">
                            {[
                                {
                                    name: "NexCoin Platinum",
                                    color: "bg-[linear-gradient(135deg,#a8a9ad_0%,#d1d2d5_20%,#f1f2f6_40%,#ffffff_50%,#f1f2f6_60%,#d1d2d5_80%,#a8a9ad_100%)]",
                                    text: "text-zinc-900/80",
                                    rotation: "lg:-rotate-2",
                                    chip: "silver",
                                    holder: "JAMES ANDERSON",
                                    number: "4208 8124 9051 2234",
                                    expiry: "09/27",
                                    features: ["Taxa Zero", "Cashback 0.5%", "Ativos em até 12h"]
                                },
                                {
                                    name: "NexCoin Black",
                                    color: "bg-gradient-to-br from-[#0f0f0f] via-[#2c2c2c] to-[#000000]",
                                    text: "text-white/90",
                                    rotation: "lg:scale-105 z-20",
                                    chip: "silver",
                                    holder: "ELENA RODRÍGUEZ",
                                    number: "4208 7742 8810 9945",
                                    expiry: "11/29",
                                    features: ["Cashback 1.5%", "Proteção Pro", "Ativos em até 6h"]
                                },
                                {
                                    name: "NexCoin Elite",
                                    color: "bg-[linear-gradient(135deg,#b88a44_0%,#e1b66b_20%,#fdf5b7_40%,#ffffff_50%,#fdf5b7_60%,#e1b66b_80%,#b88a44_100%)]",
                                    text: "text-amber-950/80",
                                    rotation: "lg:rotate-2",
                                    chip: "gold",
                                    holder: "CHEN WEI",
                                    number: "4208 5521 3340 7712",
                                    expiry: "05/30",
                                    features: ["Cashback 3.0%", "Seguros Premium", "Ativos em até 2h"]
                                }
                            ].map((card, i) => (
                                <div key={i} className="flex flex-col items-center gap-6">
                                    <motion.div
                                        initial={{ y: 50, opacity: 0 }}
                                        whileInView={{ y: 0, opacity: 1 }}
                                        whileHover={{
                                            scale: 1.05,
                                            rotateY: -20,
                                            rotateX: 12,
                                            boxShadow: "0 50px 100px -20px rgba(0,0,0,0.5)"
                                        }}
                                        viewport={{ once: true }}
                                        transition={{ type: "spring", stiffness: 150, damping: 12 }}
                                        className={`w-[320px] sm:w-[360px] h-[200px] sm:h-[225px] rounded-[18px] shadow-2xl relative overflow-hidden flex flex-col p-6 lg:p-8 justify-between border border-white/40 shrink-0 cursor-pointer 
                                        ${card.color} ${card.rotation} isolate`}
                                        style={{ transformStyle: 'preserve-3d' }}
                                    >
                                        {/* Hyper-Realistic Shine Animation */}
                                        <motion.div
                                            animate={{
                                                left: ['-100%', '250%'],
                                            }}
                                            transition={{
                                                duration: 4,
                                                repeat: Infinity,
                                                repeatDelay: 2,
                                                ease: "easeInOut"
                                            }}
                                            className="absolute inset-0 w-2/3 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-25 pointer-events-none z-0"
                                        />

                                        <div className="relative z-10" style={{ transform: 'translateZ(50px)' }}>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex flex-col">
                                                    <p className={`text-xl lg:text-2xl font-black tracking-tight uppercase ${card.text}`}>NexCoin</p>
                                                    <p className={`text-[9px] font-bold tracking-[0.4em] uppercase opacity-70 ${card.text}`}>{card.name.split(' ')[1]}</p>
                                                </div>

                                                {/* Realistic Integrated Circuit Chip */}
                                                <div className={`w-14 h-11 rounded-lg relative overflow-hidden border border-black/10 shadow-lg flex items-center justify-center
                                                ${card.chip === 'gold' ? 'bg-[linear-gradient(135deg,#d4af37,#fdf5b7,#d4af37)]' : 'bg-[linear-gradient(135deg,#a0a0a0,#e0e0e0,#a0a0a0)]'}`}>
                                                    <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-[1.5px] p-[3px] opacity-30">
                                                        {[...Array(16)].map((_, idx) => (
                                                            <div key={idx} className="border-[0.5px] border-black/30" />
                                                        ))}
                                                    </div>
                                                    <div className="w-10 h-7 border border-black/10 rounded-md relative z-10 bg-black/5" />
                                                </div>
                                            </div>

                                            {/* Embossed Card Number */}
                                            <p className={`text-lg sm:text-2xl font-mono tracking-[0.15em] mb-2 ${card.text}`}
                                                style={{ textShadow: i === 2 ? '1px 1px 1px rgba(255,255,255,0.7), -1px -1px 1px rgba(0,0,0,0.3)' : '1px 1px 1px rgba(0,0,0,0.6), -1px -1px 1px rgba(255,255,255,0.2)' }}>
                                                {card.number}
                                            </p>
                                        </div>

                                        <div className="relative z-10 flex justify-between items-end" style={{ transform: 'translateZ(60px)' }}>
                                            <div className="flex flex-col">
                                                <p className={`text-[8px] uppercase font-bold opacity-60 mb-0.5 ${card.text}`}>Valid Thru {card.expiry}</p>
                                                <p className={`text-[11px] font-black uppercase tracking-[0.2em] ${card.text}`}>{card.holder}</p>
                                            </div>
                                            {/* Detailed Mastercard Branding */}
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center mb-0.5">
                                                    <div className="w-7 h-7 rounded-full bg-[#EB001B] relative flex items-center justify-center">
                                                        <div className="absolute right-[-11px] w-7 h-7 rounded-full bg-[#F79E1B]/95 mix-blend-normal shadow-sm" />
                                                    </div>
                                                </div>
                                                <p className={`text-[6px] font-black tracking-tight italic mt-1 ${card.text} opacity-80 uppercase`} style={{ transform: 'translateX(5px)' }}>mastercard</p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Features & Action */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 + (i * 0.1) }}
                                        className="flex flex-col items-center w-full"
                                    >
                                        <ul className="flex flex-col gap-2 mb-6">
                                            {card.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => onNavigate('signup')}
                                            className={`w-full py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95
                                            ${i === 1 ? 'bg-black text-white shadow-xl px-12' : 'bg-white text-black border border-gray-200 px-8'}`}
                                        >
                                            Escolher {card.name.split(' ')[1]}
                                        </button>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Feature 2: Lifestyle/Savings */}
                <section className="relative min-h-[500px] lg:min-h-screen flex items-center py-20 lg:py-32">
                    <div className="absolute inset-0 z-0">
                        <img
                            src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=2070&auto=format&fit=crop"
                            alt="Life"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40" />
                    </div>

                    <div className="max-w-7xl mx-auto px-6 relative z-10 text-center text-white w-full">
                        <motion.h2 {...fadeInProps} variants={fadeInVariants} className="text-3xl lg:text-7xl font-black mb-6 tracking-tighter leading-tight">{t.landingPage.highYieldTitle}</motion.h2>
                        <motion.p {...fadeInProps} variants={fadeInVariants} className="text-lg lg:text-xl opacity-90 mb-8 lg:mb-10 max-w-2xl mx-auto text-white/80">{t.landingPage.highYieldSubtitle}</motion.p>
                        <motion.button
                            onClick={() => onNavigate('signup')}
                            {...fadeInProps}
                            variants={fadeInVariants}
                            className="bg-white text-black px-8 lg:px-10 py-3 lg:py-4 rounded-full font-bold text-lg"
                        >
                            {t.landingPage.exploreYields}
                        </motion.button>
                    </div>
                </section>

                {/* Feature 3: Security */}
                <section className="py-20 lg:py-32 bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 items-center gap-12 lg:gap-20 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <h2 className="text-3xl lg:text-5xl font-black tracking-tighter mb-6 lg:mb-8 leading-tight">{t.landingPage.safeHarborTitle}</h2>
                            <p className="text-lg lg:text-xl text-gray-600 mb-8 leading-relaxed">
                                {t.landingPage.safeHarborSubtitle}
                            </p>
                            <button
                                onClick={() => onNavigate('signup')}
                                className="bg-black text-white px-8 py-3 rounded-full font-bold flex items-center justify-center lg:justify-start gap-2 mx-auto lg:mx-0"
                            >
                                {t.landingPage.security} <ArrowRight size={18} />
                            </button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50, rotate: 10 }}
                            whileInView={{ opacity: 1, x: 0, rotate: -6 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="flex justify-center mt-8 lg:mt-0"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500 rounded-full blur-[80px] lg:blur-[100px] opacity-20" />
                                <div className="w-48 h-48 lg:w-96 lg:h-96 relative z-10 flex items-center justify-center">
                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-[2rem] lg:rounded-[2.5rem] p-1 shadow-inner">
                                        <div className="w-full h-full bg-white rounded-[1.8rem] lg:rounded-[2.2rem] flex items-center justify-center shadow-2xl">
                                            <Shield className="w-20 h-20 lg:w-[120px] lg:h-[120px] text-black" strokeWidth={1.5} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Feature 4: Crypto */}
                <section className="py-20 lg:py-24 bg-black text-white">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <motion.h2 {...fadeInProps} variants={fadeInVariants} className="text-2xl lg:text-5xl font-black mb-6 lg:mb-8 tracking-tighter">{t.landingPage.enterCryptoTitle}</motion.h2>
                        <motion.p {...fadeInProps} variants={fadeInVariants} className="text-lg lg:text-xl text-white/60 mb-10 lg:mb-12 max-w-2xl mx-auto">{t.landingPage.enterCryptoSubtitle}</motion.p>
                        <motion.button
                            onClick={() => onNavigate('signup')}
                            {...fadeInProps}
                            variants={fadeInVariants}
                            className="bg-white text-black px-8 lg:px-10 py-3 lg:py-4 rounded-full font-bold mb-12 lg:mb-20 hover:scale-105 transition-transform"
                        >
                            {t.landingPage.exploreCrypto}
                        </motion.button>

                        <div className="relative flex justify-center py-10 lg:py-16 h-[250px] lg:h-[350px] items-center overflow-visible">
                            {/* Center - Bitcoin */}
                            <motion.div
                                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                                className="z-10"
                            >
                                <div className="inline-flex items-center justify-center rounded-full border-2 lg:border-4 border-green-500/30 bg-black shadow-[0_0_50px_rgba(38,161,123,0.3)] p-1 lg:p-2">
                                    <CryptoIcon symbol="USDT" size="lg" />
                                </div>
                            </motion.div>

                            {/* Ethereum */}
                            <motion.div
                                animate={{ y: [0, 25, 0], x: [0, 10, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                className="absolute left-[2%] lg:left-[15%] top-0 lg:top-5 shadow-2xl"
                            >
                                <CryptoIcon symbol="ETH" size="lg" />
                            </motion.div>

                            {/* Dogecoin */}
                            <motion.div
                                animate={{ y: [0, -15, 0], x: [0, -10, 0] }}
                                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                className="absolute right-[2%] lg:right-[15%] top-2 lg:top-10 shadow-2xl"
                            >
                                <CryptoIcon symbol="DOGE" size="lg" />
                            </motion.div>

                            {/* Solana */}
                            <motion.div
                                animate={{ y: [0, 20, 0], x: [0, 15, 0] }}
                                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                className="absolute left-[10%] lg:left-[22%] bottom-5 lg:bottom-10 shadow-2xl"
                            >
                                <CryptoIcon symbol="SOL" size="lg" />
                            </motion.div>

                            {/* Litecoin */}
                            <motion.div
                                animate={{ y: [0, -25, 0], x: [0, -8, 0] }}
                                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                                className="absolute right-[10%] lg:right-[22%] bottom-2 lg:bottom-8 shadow-2xl"
                            >
                                <CryptoIcon symbol="LTC" size="lg" />
                            </motion.div>

                            {/* Additional Coins */}

                            {/* XRP */}
                            <motion.div
                                animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                                className="absolute left-[30%] lg:left-[35%] top-[-10px] lg:top-0 opacity-60 lg:opacity-80"
                            >
                                <CryptoIcon symbol="XRP" size="md" />
                            </motion.div>

                            {/* Cardano */}
                            <motion.div
                                animate={{ y: [0, -18, 0], rotate: [0, 10, 0] }}
                                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                                className="absolute right-[30%] lg:right-[35%] top-[-5px] lg:top-5 opacity-60 lg:opacity-80"
                            >
                                <CryptoIcon symbol="ADA" size="md" />
                            </motion.div>

                            {/* Polkadot */}
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], y: [0, 12, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
                                className="absolute left-[35%] lg:left-[40%] bottom-[-10px] lg:bottom-0 opacity-60"
                            >
                                <CryptoIcon symbol="DOT" size="md" />
                            </motion.div>

                            {/* Polygon */}
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], y: [0, -12, 0] }}
                                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                                className="absolute right-[35%] lg:right-[40%] bottom-[-5px] lg:bottom-5 opacity-60"
                            >
                                <CryptoIcon symbol="MATIC" size="md" />
                            </motion.div>

                            {/* BTC */}
                            <motion.div
                                animate={{ y: [0, -15, 0], x: [0, -10, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
                                className="absolute right-[5%] lg:right-[8%] top-[40%] lg:top-[35%] shadow-xl z-20"
                            >
                                <CryptoIcon symbol="BTC" size="lg" />
                            </motion.div>

                            {/* BNB */}
                            <motion.div
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute left-[15%] lg:left-[28%] top-[20%] lg:top-[30%] opacity-40 group-hover:opacity-100 transition-opacity"
                            >
                                <CryptoIcon symbol="BNB" size="sm" />
                            </motion.div>

                            {/* Avalanche */}
                            <motion.div
                                animate={{ y: [0, 20, 0] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                                className="absolute right-[15%] lg:right-[28%] top-[20%] lg:top-[30%] opacity-40 group-hover:opacity-100 transition-opacity"
                            >
                                <CryptoIcon symbol="AVAX" size="sm" />
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 lg:py-24 bg-gradient-to-br from-blue-600 via-indigo-700 to-black text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
                        <h2 className="text-2xl lg:text-4xl font-black mb-8 lg:mb-10 tracking-tighter leading-tight">{t.landingPage.joinThousands}</h2>
                        <button
                            onClick={() => onNavigate('signup')}
                            className="bg-white text-black px-8 lg:px-10 py-4 lg:py-5 rounded-full font-bold text-lg lg:text-xl hover:scale-105 transition-transform"
                        >
                            {t.landingPage.openAccountNow}
                        </button>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-50 pt-24 pb-20">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-12 mb-20">
                            <div className="col-span-2">
                                <h1 className="text-3xl font-black italic mb-8">NexCoin</h1>
                                <p className="text-gray-500 max-w-xs mb-8">{t.landingPage.footerTagline}</p>
                                <div className="flex gap-4">
                                </div>
                            </div>

                            <div>
                                <p className="font-bold text-sm uppercase mb-6 tracking-widest">{t.landingPage.footerProduct}</p>
                                <ul className="flex flex-col gap-4 text-gray-500 text-sm font-semibold">
                                    <li><a href="#" className="hover:text-black transition-colors">{t.landingPage.footerCards}</a></li>
                                    <li><a href="#" className="hover:text-black transition-colors">{t.landingPage.footerCrypto}</a></li>
                                    <li><a href="#" className="hover:text-black transition-colors">{t.landingPage.footerBalances}</a></li>
                                    <li><a href="#" className="hover:text-black transition-colors">{t.landingPage.footerYields}</a></li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-bold text-sm uppercase mb-6 tracking-widest">{t.landingPage.footerCompany}</p>
                                <ul className="flex flex-col gap-4 text-gray-500 text-sm font-semibold">
                                    <li><a href="#" className="hover:text-black transition-colors">{t.landingPage.footerAbout}</a></li>
                                    <li><a href="#" className="hover:text-black transition-colors">{t.landingPage.footerCareers}</a></li>
                                    <li><a href="#" className="hover:text-black transition-colors">{t.landingPage.footerBlog}</a></li>
                                    <li><a href="#" className="hover:text-black transition-colors">{t.landingPage.footerPress}</a></li>
                                </ul>
                            </div>

                            <div>
                                <p className="font-bold text-sm uppercase mb-6 tracking-widest">{t.landingPage.footerSupport}</p>
                                <ul className="flex flex-col gap-4 text-gray-500 text-sm font-semibold">
                                    <li><a href="#" className="hover:text-black transition-colors">{t.landingPage.footerHelp}</a></li>
                                    <li><a href="#" className="hover:text-black transition-colors">{t.landingPage.footerContact}</a></li>
                                    <li><a href="#" className="hover:text-black transition-colors">{t.landingPage.footerSecurity}</a></li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-12 text-center lg:text-left">
                            <p className="text-gray-400 text-xs leading-relaxed max-w-4xl">
                                {t.landingPage.footerDisclaimer}
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
