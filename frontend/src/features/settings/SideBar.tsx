import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, Link } from '@tanstack/react-router'
import {
    Menu,
    MessageSquare,
    Edit2,
    Trash2,
    PlusCircle
} from 'lucide-react'

const navItems = [
    { label: 'Prompts', icon: MessageSquare, to: '/settings/prompts' },
    { label: 'Modify Personas', icon: Edit2, to: '/settings/personas/modify' },
    { label: 'Delete Personas', icon: Trash2, to: '/settings/personas/delete' },
    { label: 'Add Personas', icon: PlusCircle, to: '/settings/personas/add' }
]

export default function SideNav() {
    const { state: { location } } = useRouter()
    const currentPath = location.pathname
    const [open, setOpen] = useState(false)

    const toggle = () => setOpen(state => !state)
    const close = () => setOpen(false)

    return (
        <>
            {/* Mobile Hamburger */}
            <button
                className="lg:hidden p-2 m-2 rounded-md bg-gray-100 hover:bg-gray-200"
                onClick={toggle}
                aria-label="Toggle navigation"
            >
                <Menu size={24} />
            </button>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {open && (
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'tween' }}
                        className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg lg:hidden"
                    >
                        <nav className="mt-8">
                            {navItems.map(item => {
                                const Icon = item.icon
                                const isActive = currentPath === item.to
                                return (
                                    <Link
                                        key={item.to}
                                        to={item.to}
                                        className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-100 ${isActive ? 'bg-gray-200 font-semibold' : ''
                                            }`}
                                        onClick={close}
                                    >
                                        <Icon size={20} className="mr-3" />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <nav>
                {navItems.map(item => {
                    const Icon = item.icon
                    const isActive = currentPath === item.to
                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`flex items-center w-full px-4 py-3 text-left hover:bg-gray-20 ${isActive ? 'bg-gray-100 font-semibold' : ''
                                }`}
                        >
                            <Icon size={20} className="mr-3" />
                            {item.label}
                        </Link>
                    )
                })}
            </nav>
        </>
    )
}
