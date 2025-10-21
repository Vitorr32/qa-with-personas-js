import { getPersonaAvatar } from "../../utils/Avatar";
import { Persona } from "../../utils/Persona";
import TagChipList from "../utils/TagChipList";

interface PersonaCardEditProps {
    persona: Persona;
    onClick: () => void;
}

export default function PersonaCardEdit({ persona, onClick }: PersonaCardEditProps) {
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
        >
            <div className="flex items-center gap-3 mb-3">
                {getPersonaAvatar(persona)}
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{persona.name}</h4>
                    <p className="text-xs text-gray-600 truncate italic">"{persona.greeting}"</p>
                </div>
            </div>
            <TagChipList tags={persona.tags} />
        </div>
    );
}