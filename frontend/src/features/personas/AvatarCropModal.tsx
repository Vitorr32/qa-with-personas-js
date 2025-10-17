import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { toast } from 'react-toastify';

type Props = {
    imageSrc: string; // data URL
    onCancel: () => void;
    onComplete: (fileBlob: Blob, fileName: string) => void;
    outputSize?: number; // square px
};

function createImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = dataUrl;
    });
}

async function getCroppedImg(dataUrl: string, pixelCrop: { x: number; y: number; width: number; height: number }, outputSize = 64): Promise<Blob> {
    const image = await createImage(dataUrl);

    // draw the cropped area to a temporary canvas
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
    );

    // now scale/copy to the final square canvas and apply circular mask
    const outCanvas = document.createElement('canvas');
    outCanvas.width = outputSize;
    outCanvas.height = outputSize;
    const outCtx = outCanvas.getContext('2d')!;

    // draw circular clipping path
    outCtx.clearRect(0, 0, outputSize, outputSize);
    outCtx.beginPath();
    outCtx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    outCtx.closePath();
    outCtx.save();
    outCtx.clip();

    // draw scaled image to fill final canvas
    outCtx.drawImage(canvas, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, outputSize, outputSize);
    outCtx.restore();

    return await new Promise<Blob>((resolve) => outCanvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85));
}

export default function AvatarCropModal({ imageSrc, onCancel, onComplete, outputSize = 64 }: Props) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const onCropComplete = useCallback((_: any, croppedAreaPixelsLocal: any) => {
        setCroppedAreaPixels(croppedAreaPixelsLocal);
    }, []);

    const handleSave = useCallback(async () => {
        if (!croppedAreaPixels) return;
        try {
            const blob = await getCroppedImg(imageSrc, croppedAreaPixels, outputSize);
            onComplete(blob, `avatar-${Date.now()}.jpg`);
        } catch (err: any) {
            toast.error(err);
        }
    }, [croppedAreaPixels, imageSrc, onComplete, outputSize]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-lg w-[90%] max-w-xl p-4">
                <div className="relative w-full aspect-square bg-gray-100">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                    {/* Circular overlay */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div style={{ width: '64%', height: '64%', borderRadius: '50%', boxShadow: '0 0 0 9999px rgba(0,0,0,0.35) inset', }} />
                    </div>
                </div>

                <div className="mt-4 flex items-center gap-4">
                    <label className="flex-1 flex items-center gap-2">
                        <span className="text-sm text-gray-600">Zoom</span>
                        <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
                    </label>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-200">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white">Save</button>
                </div>
            </div>
        </div>
    );
}
