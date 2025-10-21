import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, X, Edit2, Menu } from 'lucide-react';
import PromptsEditor from '../features/settings/PromptsEditor';
import PersonaEdit from '../features/settings/PersonaEdit';
import AddPersonaSection from '../features/personas/PersonaAdd';
import RemovePersonasSection from '../features/personas/PersonaRemove';

type SettingsSection = 'prompts' | 'edit' | 'add' | 'remove';

function SettingsPage() {
    const [activeSection, setActiveSection] = useState<SettingsSection>('prompts');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{ minHeight: 'calc(100vh - 73px)' }}>
            <div className="flex max-w-7xl mx-auto">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="fixed top-20  left-4 z-40 p-2 bg-white rounded-lg shadow-lg md:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
                    />
                )}
                <motion.aside
                    initial={false}
                    animate={{ x: isMobileMenuOpen ? 0 : '-100%' }}
                    transition={{ type: 'tween', duration: 0.3 }}
                    className="fixed md:relative w-64 bg-white border-r border-gray-200 min-h-screen md:min-h-[calc(100vh-73px)] p-4 z-50 md:translate-x-0 top-0"
                >
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="absolute top-4 right-4 p-2 md:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <nav className="space-y-1 mt-12 md:mt-0">
                        <SideMenuItem
                            icon={<FileText className="w-5 h-5" />}
                            label="System Prompts"
                            active={activeSection === 'prompts'}
                            onClick={() => setActiveSection('prompts')}
                        />
                        <SideMenuItem
                            icon={<Edit2 className="w-5 h-5" />}
                            label="Edit Personas"
                            active={activeSection === 'edit'}
                            onClick={() => setActiveSection('edit')}
                        />
                        <SideMenuItem
                            icon={<Plus className="w-5 h-5" />}
                            label="Add Persona"
                            active={activeSection === 'add'}
                            onClick={() => setActiveSection('add')}
                        />
                        <SideMenuItem
                            icon={<Trash2 className="w-5 h-5" />}
                            label="Remove Personas"
                            active={activeSection === 'remove'}
                            onClick={() => setActiveSection('remove')}
                        />
                    </nav>
                </motion.aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <AnimatePresence mode="wait">
                        {activeSection === 'prompts' && (<PromptsEditor />)}
                        {activeSection === 'edit' && (<PersonaEdit />)}
                        {activeSection === 'add' && (<AddPersonaSection />)}
                        {activeSection === 'remove' && (<RemovePersonasSection />)}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

function SideMenuItem({ icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
        >
            {icon}
            <span className="font-medium text-sm">{label}</span>
        </button>
    );
}

export default SettingsPage;