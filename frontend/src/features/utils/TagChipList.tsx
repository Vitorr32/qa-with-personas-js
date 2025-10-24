import { Tag } from "../../utils/Tag";

interface TagChipListProps {
    tags: Tag[];
    theme?: 'light' | 'dark';
}


export default function TagChipList({ tags, theme = 'light' }: TagChipListProps) {
    const displayTags = tags.slice(0, 3);
    const hasMoreTags = tags.length > 3;

    return (
        <div className="flex flex-wrap gap-1">
            {displayTags.map((tag) => (
                <span key={tag.id} className={`px-2 py-1 text-xs rounded-full font-medium ${theme === "light" ? "bg-gray-100 text-gray-700" : "bg-white text-gray-700 border-gray-200"}`}>
                    {tag.name}
                </span>
            ))}
            {hasMoreTags && (
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${theme === "light" ? "bg-gray-100 text-gray-700" : "bg-white text-gray-700 border-gray-200"}`}>
                    +{tags.length - 3}
                </span>
            )}
        </div>
    );
}