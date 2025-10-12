import React from "react";
import { generateAvatarData } from "../../utils/Avatar";

interface AvatarProps {
    name: string;
    imageUrl?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl',
};

export default function Avatar({ name, imageUrl, size = 'md', className = '' }: AvatarProps) {
    const [imageError, setImageError] = React.useState(false);
    const { initials, backgroundColor, textColor } = generateAvatarData(name);
    const showInitials = !imageUrl || imageError;

    return (
        <div
            className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${className}`}
            style={showInitials ? { backgroundColor, color: textColor } : undefined}
        >
            {!showInitials ? (
                <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full rounded-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <span>{initials}</span>
            )}
        </div>
    );
}