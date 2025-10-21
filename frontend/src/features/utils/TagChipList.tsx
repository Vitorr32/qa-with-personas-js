import { Tag } from "../../utils/Tag";

export default function TagChipList({ tags }: { tags: Tag[] }) {
    const displayTags = tags.slice(0, 3);
    const hasMoreTags = tags.length > 3;

    return (
        <div className="flex flex-wrap gap-1">
            {displayTags.map((tag) => (
                <span key={tag.id} className={`px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-700`}>
                    {tag.name}
                </span>
            ))}
            {hasMoreTags && (
                <span className={`px-2 py-1 text-xs rounded-full font-medium bg-gray-100 text-gray-700`}>
                    +{tags.length - 3}
                </span>
            )}
        </div>
    );
}