
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Persona } from '../../utils/Persona';
import { getPersonaAvatar } from '../../utils/Avatar';

interface PersonaChipProps {
    persona: Persona;
    onRemove: (personaId: Persona) => void;
    animationDelay?: number;
}

export default function PersonaChip({
    persona,
    onRemove,
    animationDelay = 0
}: PersonaChipProps) {
    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ delay: animationDelay }}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-2 py-2 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 group"
        >
            {/* Avatar */}
            <div className="flex-shrink-0">
                {getPersonaAvatar(persona, 8)}
            </div>

            {/* Name */}
            <span className="text-sm font-medium truncate max-w-[150px]">
                {persona.name}
            </span>

            {/* Remove Button */}
            <button
                onClick={() => onRemove(persona)}
                className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
                aria-label={`Remove ${persona.name}`}
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
}