
interface LoadingContainerProps {
    isLoading: boolean;
    children: React.ReactNode;
}

export default function LoadingContainer({ isLoading, children }: LoadingContainerProps) {
    return (
        <div className="relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
                    <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-8 w-8"></div>
                </div>
            )}
            {!isLoading && (
                <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>{children}</div>
            )}
        </div>
    );
}