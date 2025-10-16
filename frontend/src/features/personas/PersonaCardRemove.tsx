import { Check } from "lucide-react";
import { generateAvatarData } from "../../utils/Avatar";

export default function PersonaCardRemove({ persona, isSelected, onToggle }: any) {
    const { initials, backgroundColor, textColor } = generateAvatarData(persona.name);

    return (
        <div
            onClick={onToggle}
            className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all ${isSelected
                ? 'border-red-500 bg-red-50 shadow-lg shadow-red-200'
                : 'border-gray-200 hover:border-red-300 hover:shadow-md'
                }`}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {persona.avatar ? (
                        <img src={persona.avatar} alt={persona.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white" style={{ backgroundColor: backgroundColor, color: textColor }}>
                            {initials}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{persona.name}</h4>
                        <p className="text-xs text-gray-600 truncate italic">"{persona.greeting}"</p>
                    </div>
                </div>
                <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-red-600 border-red-600' : 'border-gray-300'
                    }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                </div>
            </div>
            <div className="flex flex-wrap gap-1">
                {persona.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className={`px-2 py-1 text-xs rounded-full ${isSelected ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    );
}