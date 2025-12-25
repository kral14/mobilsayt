import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string, decodedResult: any) => void;
    onScanFailure?: (error: any) => void;
    width?: number;
    height?: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
    onScanSuccess,
    width = 400
}) => {
    const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
    const [isCameraRunning, setIsCameraRunning] = useState(false);
    const [statusText, setStatusText] = useState<string>('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Transform state
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const readerId = "reader-custom-element";
    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const instance = new Html5Qrcode(readerId, {
            experimentalFeatures: { useBarCodeDetectorIfSupported: true },
            verbose: false,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.QR_CODE,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.EAN_8,
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.CODE_39,
                Html5QrcodeSupportedFormats.UPC_A,
                Html5QrcodeSupportedFormats.UPC_E,
                Html5QrcodeSupportedFormats.CODABAR,
                Html5QrcodeSupportedFormats.DATA_MATRIX
            ]
        });
        setHtml5QrCode(instance);

        return () => {
            if (instance.isScanning) {
                instance.stop().catch(console.error);
            }
            instance.clear();
        };
    }, []);

    // Auto-start camera when instance is ready
    useEffect(() => {
        if (html5QrCode && !isCameraRunning && !selectedImage) {
            startCamera();
        }
    }, [html5QrCode]);

    const startCamera = () => {
        if (!html5QrCode) return;
        setSelectedImage(null);
        setIsCameraRunning(true);
        setStatusText('Kamera başladılır...');

        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText, decodedResult) => onScanSuccess(decodedText, decodedResult),
            () => { }
        ).catch(err => {
            setIsCameraRunning(false);
            setStatusText('Kamera xətası: ' + err);
        });
    };

    const stopCamera = async () => {
        if (html5QrCode && isCameraRunning) {
            await html5QrCode.stop();
            setIsCameraRunning(false);
            setStatusText('');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            stopCamera();
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setSelectedImage(url);
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setStatusText('Barkodu qırmızı çərçivəyə gətirin və "Skan Et" düyməsini sıxın.');
        }
    };

    const handleScanCroppedParams = async () => {
        if (!html5QrCode || !imageRef.current || !containerRef.current) return;

        setStatusText('Emal olunur...');

        try {
            // Calculate what is visible in the container (300x300 viewport)
            // The container is the "frame"
            const containerW = containerRef.current.clientWidth;
            const containerH = containerRef.current.clientHeight;

            // We need to draw the visible portion of the image onto a canvas
            const canvas = document.createElement('canvas');
            canvas.width = containerW;
            canvas.height = containerH;
            const ctx = canvas.getContext('2d');

            if (!ctx) return;

            // Mathematical transformation to map image pixels to canvas
            // The image is drawn at `position.x, position.y` with size `imgW * scale, imgH * scale`
            // We want to capture the 0,0 to containerW,containerH rectangle of the VIEWPORT
            // So we just draw the image on the canvas with the same transforms!

            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, containerW, containerH); // Background

            // Center alignment offset if needed, but here we just use the raw position relative to container
            // The container is `overflow: hidden`, so drawing it similarly on canvas captures exactly what user sees
            ctx.translate(containerW / 2, containerH / 2); // Pivot center
            ctx.translate(position.x, position.y);
            ctx.scale(scale, scale);
            ctx.drawImage(imageRef.current, -imageRef.current.width / 2, -imageRef.current.height / 2);

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setStatusText('Canvas xətası');
                    return;
                }
                const file = new File([blob], "crop.jpg", { type: "image/jpeg" });
                try {
                    const res = await html5QrCode.scanFile(file, true);
                    onScanSuccess(res, { result: res });
                    setStatusText('Oxundu!');
                } catch (e) {
                    console.error(e);
                    setStatusText('Kod tapılmadı. Zəhmət olmasa daha dəqiq yaxınlaşdırın.');
                }
            }, 'image/jpeg', 1.0);

        } catch (e) {
            setStatusText('Xəta: ' + e);
        }
    };

    // --- Mouse Interaction for Pan ---
    const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragStart({ x: clientX - position.x, y: clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
        <div style={{ padding: '10px', textAlign: 'center', userSelect: 'none' }}>
            {/* Camera View */}
            <div
                id={readerId}
                style={{
                    display: isCameraRunning ? 'block' : 'none',
                    width: '100%', maxWidth: width, margin: '0 auto'
                }}
            ></div>

            {/* Manual Crop View */}
            {selectedImage && !isCameraRunning && (
                <div style={{ marginBottom: '15px' }}>
                    <div
                        ref={containerRef}
                        style={{
                            width: '300px',
                            height: '200px',
                            margin: '0 auto',
                            border: '2px dashed red',
                            overflow: 'hidden',
                            position: 'relative',
                            background: '#333',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            touchAction: 'none'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={handleMouseUp}
                    >
                        <img
                            ref={imageRef}
                            src={selectedImage}
                            alt="Preview"
                            style={{
                                transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transformOrigin: 'center center',
                                maxWidth: 'none',
                                pointerEvents: 'none' // Let container handle events
                            }}
                            draggable={false}
                        />
                        {/* Crosshair Overlay */}
                        <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: 'rgba(255,0,0,0.5)', pointerEvents: 'none' }}></div>
                        <div style={{ position: 'absolute', left: '50%', top: '0', bottom: '0', width: '1px', background: 'rgba(255,0,0,0.5)', pointerEvents: 'none' }}></div>
                    </div>

                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                            onClick={() => setScale(s => Math.max(0.1, s - 0.1))}
                            style={{ padding: '5px 15px', fontSize: '1.2rem' }}
                        >-</button>
                        <input
                            type="range"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            style={{ width: '150px' }}
                        />
                        <button
                            onClick={() => setScale(s => s + 0.1)}
                            style={{ padding: '5px 15px', fontSize: '1.2rem' }}
                        >+</button>
                    </div>

                    <button
                        onClick={handleScanCroppedParams}
                        style={{
                            marginTop: '10px',
                            padding: '10px 25px',
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Skan Et
                    </button>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px' }}>
                        Şəkli sürüşdürə və böyüdə bilərsiniz
                    </div>
                </div>
            )}

            {/* Controls */}
            <div style={{ marginTop: '15px', display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                {!isCameraRunning && !selectedImage && (
                    <button
                        onClick={startCamera}
                        style={{ padding: '10px 20px', background: '#007bff', color: 'white', borderRadius: '5px', border: 'none' }}
                    >
                        📷 Kamera Başlat
                    </button>
                )}

                {isCameraRunning && (
                    <button
                        onClick={stopCamera}
                        style={{ padding: '10px 20px', background: '#dc3545', color: 'white', borderRadius: '5px', border: 'none' }}
                    >
                        ⏹ Dayan
                    </button>
                )}

                <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{ padding: '10px 20px', background: '#6c757d', color: 'white', borderRadius: '5px', border: 'none' }}
                >
                    🖼️ Şəkil Yüklə
                </button>

                {selectedImage && (
                    <button
                        onClick={() => {
                            setSelectedImage(null);
                            startCamera();
                        }}
                        style={{ padding: '10px 20px', background: '#dc3545', color: 'white', borderRadius: '5px', border: 'none' }}
                    >
                        ❌ Ləğv et və Kameraya qayıt
                    </button>
                )}
            </div>

            {statusText && (
                <div style={{ marginTop: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '5px', border: '1px solid #dee2e6' }}>
                    {statusText}
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
