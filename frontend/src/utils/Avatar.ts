import { Persona } from "./Persona";

const AVATAR_COLORS = [
    { bg: '#3B82F6', text: '#FFFFFF' }, // Blue
    { bg: '#8B5CF6', text: '#FFFFFF' }, // Purple
    { bg: '#EC4899', text: '#FFFFFF' }, // Pink
    { bg: '#EF4444', text: '#FFFFFF' }, // Red
    { bg: '#F59E0B', text: '#FFFFFF' }, // Amber
    { bg: '#10B981', text: '#FFFFFF' }, // Emerald
    { bg: '#06B6D4', text: '#FFFFFF' }, // Cyan
    { bg: '#6366F1', text: '#FFFFFF' }, // Indigo
    { bg: '#14B8A6', text: '#FFFFFF' }, // Teal
    { bg: '#F97316', text: '#FFFFFF' }, // Orange
    { bg: '#84CC16', text: '#FFFFFF' }, // Lime
    { bg: '#A855F7', text: '#FFFFFF' }, // Violet
    { bg: '#D946EF', text: '#FFFFFF' }, // Fuchsia
    { bg: '#0EA5E9', text: '#FFFFFF' }, // Sky
    { bg: '#22C55E', text: '#FFFFFF' }, // Green
];

function getColorFromString(str: string): { bg: string; text: string } {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    const index = Math.abs(hash) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

export function getInitials(name: string): string {
    if (!name || name.trim().length === 0) {
        return '?';
    }

    const trimmedName = name.trim();

    // Check if name contains CJK characters
    const cjkRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/;
    const hasCJK = cjkRegex.test(trimmedName);

    if (hasCJK) {
        const cjkChars = trimmedName.match(cjkRegex);
        if (cjkChars && cjkChars.length >= 2) {
            return cjkChars[0] + cjkChars[1];
        } else if (cjkChars && cjkChars.length === 1) {
            return cjkChars[0];
        }
    }

    const words = trimmedName.split(/[\s\-_.,]+/).filter(word => word.length > 0);

    if (words.length === 0) {
        return '?';
    }

    if (words.length === 1) {
        const word = words[0];
        if (word.length === 1) {
            return word.charAt(0).toUpperCase();
        }
        return word.substring(0, 2).toUpperCase();
    }

    const firstInitial = words[0].charAt(0).toUpperCase();
    const secondInitial = words[1].charAt(0).toUpperCase();

    return firstInitial + secondInitial;
}

export function generateAvatarData(name: string): {
    initials: string;
    backgroundColor: string;
    textColor: string;
} {
    const initials = getInitials(name);
    const colors = getColorFromString(name);

    return {
        initials,
        backgroundColor: colors.bg,
        textColor: colors.text,
    };
}

export function getAvatarUrl(avatarPath: string | undefined): string | undefined {
    // If none provided, return undefined
    if (!avatarPath) return undefined;

    // If it's already an absolute URL, return as-is
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
        return avatarPath;
    }

    // Normalize backslashes to forward slashes (Windows paths may have backslashes)
    let normalized = avatarPath.replace(/\\/g, '/');

    // Remove any leading slashes to avoid '//' when joining with base URL
    normalized = normalized.replace(/^\/+/, '');

    const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

    if (!base) return `/${normalized}`; // relative path from current origin

    return `${base}/${normalized}`;
}

export function getPersonaAvatar(persona: Persona) {

}