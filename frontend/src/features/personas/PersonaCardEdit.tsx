import { generateAvatarData, getAvatarUrl } from "../../utils/Avatar";

export default function PersonaCardEdit({ persona, onClick }: any) {
    const { initials, backgroundColor, textColor } = generateAvatarData(persona.name);

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
        >
            <div className="flex items-center gap-3 mb-3">
                {persona.avatar ? (
                    <img src={getAvatarUrl(persona.avatar)} alt={persona.name} className="w-12 h-12 rounded-full object-cover" />
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
            <div className="flex flex-wrap gap-1">
                {(persona.tags || []).slice(0, 3).map((tag: any) => {
                    const tagName = typeof tag === 'string' ? tag : tag?.name || String(tag);
                    const key = typeof tag === 'string' ? tag : tag?.id || tagName;
                    return (
                        <span key={key} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                            {tagName}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}