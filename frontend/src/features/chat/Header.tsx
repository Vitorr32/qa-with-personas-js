import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../../store/languageSlice';
import type { RootState } from '../../store/store';

function Header() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const currentLanguage = useSelector((state: RootState) => state.language.currentLanguage);
    const [showLangMenu, setShowLangMenu] = useState(false);

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'ja', name: '日本語', flag: '🇯🇵' }
    ];

    const handleLanguageChange = (langCode: string) => {
        dispatch(setLanguage(langCode));
        setShowLangMenu(false);
    };

    return (
        <motion.header
            layout
            className="px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-gray-200"
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <motion.h1
                    layout
                    className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                >
                    {t('app.name')}
                </motion.h1>

                <div className="flex gap-2 items-center">
                    {/* Language Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                            aria-label="Change language"
                        >
                            <Globe className="w-5 h-5 text-gray-700" />
                            <span className="text-sm font-medium text-gray-700">
                                {languages.find(l => l.code === currentLanguage)?.flag}
                            </span>
                        </button>

                        {showLangMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg cursor-pointer border border-gray-200 py-2 min-w-[160px] z-50"
                            >
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.code)}
                                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 cursor-pointer ${currentLanguage === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                            }`}
                                    >
                                        <span className="text-xl">{lang.flag}</span>
                                        <span className="text-sm font-medium">{lang.name}</span>
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.header>
    );
}

export default Header