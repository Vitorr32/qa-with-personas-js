import { motion } from "framer-motion"
import { Upload } from "lucide-react";
import { useState } from "react";
import { useAddPersonaMutation } from '../../store/apiSlice';
import AvatarCropModal from './AvatarCropModal';
import { Tag } from "../../utils/Tag";
import TagPicker from "./TagPicker";

export default function AddPersonaSection() {
    const [formData, setFormData] = useState({ name: '', avatar: '', greeting: '', description: '', tags: [] as string[] });
    const [selectedTags, setSelectedTags] = useState([] as Tag[]);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [addPersona] = useAddPersonaMutation();

    // Some constants
    const MAX_FILE_SIZE = 1000 * 1024; // 1 MB
    const OUTPUT_AVATAR_SIZE = 128; // 128x128 pixels

    const readFileAsDataURL = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });

    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [isCropping, setIsCropping] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            alert(`Image is too large (${Math.round(file.size / 1024)} KB). Please choose an image smaller than ${Math.round(MAX_FILE_SIZE / 1024)} KB or a smaller resolution.`);
            return;
        }

        try {
            const dataUrl = await readFileAsDataURL(file);
            setCropSrc(dataUrl);
            setIsCropping(true);
        } catch (err) {
            console.error('Failed to read file', err);
            alert('Failed to process the image. Please try another file.');
        }
    };

    const handleSubmit = async () => {
        if (formData.name && formData.greeting && formData.description) {
            try {
                // If avatar is a Blob URL or a blob was set via crop, build FormData
                const fd = new FormData();
                fd.append('name', formData.name);
                fd.append('greeting', formData.greeting);
                fd.append('description', formData.description);
                if (selectedTags && selectedTags.length) {
                    // Send tag names as array
                    fd.append('tags', JSON.stringify(selectedTags.map(t => t.name)));
                }

                // If avatar is a data URL (base64), convert it to blob
                if (formData.avatar && typeof formData.avatar === 'string' && formData.avatar.startsWith('data:')) {
                    const res = await fetch(formData.avatar);
                    const blob = await res.blob();
                    fd.append('avatar', blob, 'avatar.jpg');
                }

                console.log('Submitting new persona', formData, fd);

                await addPersona(fd as any).unwrap();
                setFormData({ name: '', avatar: '', greeting: '', description: '', tags: [] });
                setAvatarPreview('');
            } catch (err) {
                console.error('Failed to add persona', err);
            }
        }
    };

    const handleCropCancel = () => {
        setCropSrc(null);
        setIsCropping(false);
    };

    const handleCropComplete = (blob: Blob, _filename: string) => {
        // Show preview from blob and store the blob as data URL in formData.avatar
        const reader = new FileReader();
        reader.onload = () => {
            setAvatarPreview(reader.result as string);
            setFormData({ ...formData, avatar: reader.result as string });
        };
        reader.readAsDataURL(blob);
        setCropSrc(null);
        setIsCropping(false);
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tags</label>
                <TagPicker selectedTags={selectedTags} onTagPicked={(tags) => setSelectedTags(tags)} allowNewTags/>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={!formData.name || !formData.greeting || !formData.description}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Create Persona
                </button>
            </div>
            {isCropping && cropSrc && (
                <AvatarCropModal
                    imageSrc={cropSrc}
                    onCancel={handleCropCancel}
                    onComplete={handleCropComplete}
                    outputSize={OUTPUT_AVATAR_SIZE}
                />
            )}
        </motion.div>
    );
}