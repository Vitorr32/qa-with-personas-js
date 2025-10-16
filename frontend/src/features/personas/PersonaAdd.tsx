import { motion } from "framer-motion"
import { Upload, X } from "lucide-react";
import { useState } from "react";

export default function AddPersonaSection({ onAdd }: any) {
    const [formData, setFormData] = useState({ name: '', avatar: '', greeting: '', description: '', tags: [] as string[] });
    const [newTag, setNewTag] = useState('');
    const [avatarPreview, setAvatarPreview] = useState('');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
                setFormData({ ...formData, avatar: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (formData.name && formData.greeting && formData.description) {
            onAdd(formData);
            setFormData({ name: '', avatar: '', greeting: '', description: '', tags: [] });
            setAvatarPreview('');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Add New Persona</h2>
                <p className="text-gray-600">Create a new persona with custom attributes</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg space-y-4">
                {/* Avatar Upload */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Avatar (Optional)</label>
                    <div className="flex items-center gap-4">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                                <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                        <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            Choose Image
                        </label>
                    </div>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g., Code Expert"
                    />
                </div>

                {/* Greeting */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Greeting *</label>
                    <input
                        type="text"
                        value={formData.greeting}
                        onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g., Hello! I'm here to help you code."
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full h-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        placeholder="Describe the persona's expertise and capabilities..."
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newTag.trim() && !formData.tags.includes(newTag.trim())) {
                                    setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
                                    setNewTag('');
                                }
                            }}
                            placeholder="Add tag and press Enter..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                            <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2">
                                {tag}
                                <button onClick={() => setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })}>
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.greeting || !formData.description}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Create Persona
                </button>
            </div>
        </motion.div>
    );
}