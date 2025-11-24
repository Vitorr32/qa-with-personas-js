import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Home, Settings, ShieldCheck, User as UserIcon, LogOut, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setLanguage } from '../../store/languageSlice';
import type { RootState } from '../../store/store';
import { Link, useRouter } from '@tanstack/react-router';
import { logout } from '../../store/authSlice';
import { useMeQuery } from '../../store/apiSlice';

function Header() {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const currentLanguage = useSelector((state: RootState) => state.language.currentLanguage);
    const auth = useSelector((state: RootState) => state.auth);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const router = useRouter();

    // Keep user in sync if token exists
    useMeQuery(undefined, { skip: !auth.token });

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

                <motion.div className='flex items-center'>
                    <motion.nav className="flex items-center gap-2">
                        {/* Home Link */}
                        <Link
                            to="/"
                            activeOptions={{ exact: true }}
                            className="p-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                            activeProps={{ className: 'bg-blue-100 text-blue-700' }}
                            inactiveProps={{ className: 'hover:bg-gray-100 text-gray-700' }}
                            aria-label={t('header.home')}
                        >
                            <Home className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm font-medium">{t('header.home')}</span>
                        </Link>

                        {/* Settings Link */}
                        <Link
                            to="/settings"
                            activeOptions={{ exact: false }}
                            className="p-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                            activeProps={{ className: 'bg-blue-100 text-blue-700' }}
                            inactiveProps={{ className: 'hover:bg-gray-100 text-gray-700' }}
                            aria-label={t('header.settings')}
                        >
                            <Settings className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm font-medium">{t('header.settings')}</span>
                        </Link>

                        {auth.user?.role === 'SUPERUSER' && (
                            <Link
                                to="/admin/approvals"
                                className="p-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                activeProps={{ className: 'bg-blue-100 text-blue-700' }}
                                inactiveProps={{ className: 'hover:bg-gray-100 text-gray-700' }}
                                aria-label="Admin approvals"
                            >
                                <ShieldCheck className="w-5 h-5" />
                                <span className="hidden sm:inline text-sm font-medium">Approvals</span>
                            </Link>
                        )}
                    </motion.nav>

                    <div className="w-px h-6 bg-gray-300 mx-1 ml-2 mr-0" />

                    <div className="flex gap-2 items-center">
                        {/* Language Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowLangMenu(!showLangMenu)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                aria-label={t('header.changeLanguage')}
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

                        {/* User / Auth Menu */}
                        <div className="relative ml-2">
                            {!auth.token ? (
                                <div className="flex gap-2">
                                    <Link to="/login" className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 cursor-pointer">
                                        <LogIn className="w-5 h-5" />
                                        <span className="hidden sm:inline text-sm font-medium">Login</span>
                                    </Link>
                                    <Link to="/register" className="p-2 hover:bg-gray-100 rounded-lg flex items-center gap-2 cursor-pointer">
                                        <UserIcon className="w-5 h-5" />
                                        <span className="hidden sm:inline text-sm font-medium">Register</span>
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                        aria-label="Account"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                            {auth.user?.name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <span className="hidden md:inline text-sm font-medium text-gray-700">{auth.user?.name}</span>
                                    </button>
                                    {showUserMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg cursor-pointer border border-gray-200 py-2 min-w-[200px] z-50"
                                        >
                                            <div className="px-4 py-2 text-sm text-gray-600">
                                                <div className="font-medium">{auth.user?.name}</div>
                                                <div className="text-xs">{auth.user?.email}</div>
                                            </div>
                                            <Link
                                                to="/account"
                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 cursor-pointer text-gray-700"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                <Settings className="w-4 h-4" />
                                                <span className="text-sm">Account settings</span>
                                            </Link>
                                            <button
                                                onClick={() => { setShowUserMenu(false); dispatch(logout()); router.navigate({ to: '/login' }); }}
                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-3 cursor-pointer text-red-700"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span className="text-sm">Logout</span>
                                            </button>
                                        </motion.div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.header>
    );
}

export default Header