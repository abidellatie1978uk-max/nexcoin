import { QRCodeSVG } from 'qrcode.react';
import { Download, Apple, Smartphone, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

export function DownloadApp() {
    const { t } = useLanguage();
    const androidLink = "https://play.google.com/store/apps/details?id=com.nexcoin.app";
    const iosLink = "https://apps.apple.com/app/nexcoin/id6470000000";

    const containerVariants = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const itemVariants = {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-blue-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full"></div>

            <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                className="max-w-5xl w-full text-center relative z-10"
            >
                <motion.div variants={itemVariants} className="mb-4">

                </motion.div>

                <motion.div variants={itemVariants} className="mb-12">

                    <h2 className="text-3xl lg:text-5xl font-black mb-6 tracking-tight leading-tight">
                        {t.downloadApp.successSubtitle.split(',')[0]}<span className="text-blue-500">.</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                        {t.downloadApp.successSubtitle.split(',').slice(1).join(',')}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-10 mt-12">
                    {/* Android Download */}
                    <motion.div
                        variants={itemVariants}
                        className="group flex flex-col items-center relative transition-all duration-500"
                    >
                        <div className="pt-8"></div>

                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            {t.downloadApp.android}
                        </h3>
                        <div className="bg-white p-2 rounded-3xl mb-8 shadow-2xl relative group-hover:scale-[1.02] transition-transform duration-500">
                            <QRCodeSVG
                                value={androidLink}
                                size={200}
                                level="H"
                                includeMargin={false}
                                imageSettings={{
                                    src: "https://upload.wikimedia.org/wikipedia/commons/d/d7/Android_robot.svg",
                                    x: undefined,
                                    y: undefined,
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mb-8 max-w-[180px]">
                            {t.downloadApp.androidHint}
                        </p>


                    </motion.div>

                    {/* iOS Download */}
                    <motion.div
                        variants={itemVariants}
                        className="group flex flex-col items-center relative transition-all duration-500"
                    >
                        <div className="pt-8"></div>

                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            {t.downloadApp.ios}
                        </h3>
                        <div className="bg-white p-2 rounded-3xl mb-8 shadow-2xl relative group-hover:scale-[1.02] transition-transform duration-500">
                            <QRCodeSVG
                                value={iosLink}
                                size={200}
                                level="H"
                                includeMargin={false}
                                imageSettings={{
                                    src: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
                                    x: undefined,
                                    y: undefined,
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                }}
                            />
                        </div>
                        <p className="text-sm text-gray-500 mb-8 max-w-[180px]">
                            {t.downloadApp.iosHint}
                        </p>


                    </motion.div>
                </div>

                <motion.div variants={itemVariants} className="mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-gray-500 text-sm">
                    <p>{t.downloadApp.rightsReserved}</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors">{t.landingPage.footerPrivacy}</a>
                        <a href="#" className="hover:text-white transition-colors">{t.landingPage.footerTerms}</a>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
