import { Search } from "lucide-react";
import TagPicker from "../personas/TagPicker";
import { Tag } from "../../utils/Tag";

interface SearchBoxProps {
    searchQuery?: string;
    selectedTags?: Tag[];
    setSearchQuery: (query: string) => void;
    setSelectedTags: (tags: Tag[]) => void;
    injectWrapperClassNames?: string;
}

export default function SearchBox({ searchQuery = "", selectedTags = [], setSearchQuery, setSelectedTags, injectWrapperClassNames = "" }: SearchBoxProps) {

    return (
        <>
            <div className={`flex flex-col md:flex-row md:items-start gap-4 ${injectWrapperClassNames}`}>
                <div className="relative w-full md:w-[70%]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or description..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Tag Filters */}
                <div className="w-full md:w-[30%]">
                    <TagPicker selectedTags={selectedTags} onTagPicked={(tags) => setSelectedTags(tags)} />
                </div>
            </div>
        </>
    )
}