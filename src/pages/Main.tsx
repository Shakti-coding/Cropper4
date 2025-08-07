import {useEffect, useRef, useState} from "react";
import "../App.css";
import Cropper from "../component/Cropper";
import Select from "../component/Select";
import About from "../component/About";
import AdjustmentsPanel from "../component/AdjustmentsPanel";
import EffectFilters from "../component/EffectFilters";
import QualityPanel from "../component/QualityPanel";


const cropSizePresets = [
    {name: "Custom", value: null},
    {name: "256x256", value: {width: 256, height: 256}},
    {name: "512x512", value: {width: 512, height: 512}},
    {name: "1:1 Square", value: {width: 300, height: 300}},
    {name: "4:3 Standard", value: {width: 400, height: 300}},
    {name: "3:2 Photo", value: {width: 450, height: 300}},
    {name: "16:9 Widescreen", value: {width: 480, height: 270}},
]

interface ProcessingJob {
    id: string;
    name: string;
    progress: number;
    total: number;
    status: 'processing' | 'completed' | 'error';
    type: 'pdf' | 'zip';
    result?: any;
    timestamp: number;
}

interface HistoryItem {
    id: string;
    name: string;
    timestamp: number;
    files: any[];
    crops: any;
    settings: any;
    exportedFiles?: any[];
}

interface CropTab {
    id: string;
    name: string;
    files: any[];
    crops: any;
    settings: any;
    isActive: boolean;
}

// Draggable Panel Component
const DraggablePanel = ({ 
    title, 
    onClose, 
    children, 
    initialPosition, 
    initialSize, 
    borderColor = '#007bff' 
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    initialPosition: { x: number; y: number };
    initialSize: { width: number; height: number };
    borderColor?: string;
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [size, setSize] = useState(initialSize);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number }>({
        startX: 0,
        startY: 0,
        startPosX: 0,
        startPosY: 0
    });

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.no-drag')) return;

        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startPosX: position.x,
            startPosY: position.y
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging && !isResizing) return;

        if (isDragging) {
            const deltaX = e.clientX - dragRef.current.startX;
            const deltaY = e.clientY - dragRef.current.startY;

            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - size.width, dragRef.current.startPosX + deltaX)),
                y: Math.max(0, Math.min(window.innerHeight - size.height, dragRef.current.startPosY + deltaY))
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
    };

    useEffect(() => {
        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, position, size]);

    const handleResize = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = size.width;
        const startHeight = size.height;

        const handleResizeMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            setSize({
                width: Math.max(280, startWidth + deltaX),
                height: Math.max(300, startHeight + deltaY)
            });
        };

        const handleResizeEnd = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeEnd);
        };

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    };

    return (
        <div 
            style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${size.width}px`,
                height: isMinimized ? 'auto' : `${size.height}px`,
                background: 'white',
                border: `2px solid ${borderColor}`,
                borderRadius: '10px',
                zIndex: 1001,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                userSelect: 'none',
                overflow: 'hidden'
            }}
        >
            {/* Header with drag handle */}
            <div 
                onMouseDown={handleMouseDown}
                style={{
                    background: borderColor,
                    color: 'white',
                    padding: '8px 12px',
                    borderRadius: '8px 8px 0 0',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold'
                }}
            >
                <span>{title}</span>
                <div className="no-drag" style={{ display: 'flex', gap: '5px' }}>
                    <button 
                        onClick={() => setIsMinimized(!isMinimized)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px'
                        }}
                        title={isMinimized ? 'Expand' : 'Minimize'}
                    >
                        {isMinimized ? '🔼' : '🔽'}
                    </button>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '2px 4px'
                        }}
                        title="Close"
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            {!isMinimized && (
                <div 
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden'
                    }}
                >
                    {children}
                </div>
            )}

            {/* Resize handle */}
            {!isMinimized && (
                <div
                    className="no-drag"
                    onMouseDown={handleResize}
                    style={{
                        position: 'absolute',
                        bottom: '0px',
                        right: '0px',
                        width: '20px',
                        height: '20px',
                        background: borderColor,
                        cursor: 'nw-resize',
                        borderRadius: '0 0 8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px'
                    }}
                    title="Drag to resize"
                >
                    ↘
                </div>
            )}
        </div>
    );
};

function Main({ appName, aboutText } :any) {
    // Tab management
    const [tabs, setTabs] = useState<CropTab[]>([{
        id: 'tab-1',
        name: 'Crop Session 1',
        files: [],
        crops: {},
        settings: {
            cropSize: null,
            keepRatio: true,
            resizeOnExport: true,
            lockMovement: false,
            centerCrop: false,
            enableOCR: true
        },
        isActive: true
    }]);
    const [activeTabId, setActiveTabId] = useState('tab-1');

    // Current tab data
    const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
    const [files, setFiles] = useState<any[]>(activeTab.files);
    const [crops, setCrops] = useState(activeTab.crops);
    const [cropSize, setCropSize] = useState<any>(activeTab.settings.cropSize);
    const [keepRatio, setKeepRatio] = useState(activeTab.settings.keepRatio);
    const [resizeOnExport, setResizeOnExport] = useState(activeTab.settings.resizeOnExport);
    const [lockMovement, setLockMovement] = useState(activeTab.settings.lockMovement);
    const [centerCrop, setCenterCrop] = useState(activeTab.settings.centerCrop);
    const [enableOCR, setEnableOCR] = useState(activeTab.settings.enableOCR);

    // Selection and UI states
    const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
    const [holdTimer, setHoldTimer] = useState<any>(null);
    const [croppedImages, setCroppedImages] = useState<any>({});
    const [gridView, setGridView] = useState(true);
    const [currentView, setCurrentView] = useState<'crop' | 'history'>('crop');

    // Processing and history
    const [processingJobs, setProcessingJobs] = useState<ProcessingJob[]>([]);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [editingTabId, setEditingTabId] = useState<string | null>(null);
    const [editingTabName, setEditingTabName] = useState<string>('');

    // Quality panel states
    const [showQualityPanel, setShowQualityPanel] = useState<boolean>(false);
    const [showAdjustments, setShowAdjustments] = useState<boolean>(false);
    const [showEffects, setShowEffects] = useState<boolean>(false);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [selectedFilter, setSelectedFilter] = useState<any>(null);
    const [adjustmentValues, setAdjustmentValues] = useState<any>(null);
    const [showComparison, setShowComparison] = useState<boolean>(false);
    const [watermarkText, setWatermarkText] = useState<string>('WATERMARK');
    const [borderWidth, setBorderWidth] = useState<number>(10);
    const [borderColor, setBorderColor] = useState<string>('#000000');
    const [showPreviewPopup, setShowPreviewPopup] = useState<boolean>(false);
    const [previewImage, setPreviewImage] = useState<string>('');
    const [qualityPreviewImage, setQualityPreviewImage] = useState<string>('');
    const [originalCroppedImages, setOriginalCroppedImages] = useState<any>({});
    const [showFloatingPreview, setShowFloatingPreview] = useState<boolean>(false);
    const [previewSize, setPreviewSize] = useState({ width: 300, height: 200 });
    const [previewPosition, setPreviewPosition] = useState({ x: 50, y: 50 });
    const [isResizing, setIsResizing] = useState<boolean>(false);
    const [signatureText, setSignatureText] = useState<string>('');
    const [enableWatermark, setEnableWatermark] = useState<boolean>(false);
    const [enableBorder, setEnableBorder] = useState<boolean>(false);
    const [enableSignature, setEnableSignature] = useState<boolean>(false);
    const [rearrangeMode, setRearrangeMode] = useState<boolean>(false);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const globalCropTimeout = useRef<any>(null);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (globalCropTimeout.current) {
                clearTimeout(globalCropTimeout.current);
            }
        };
    }, []);

    // Update active tab when switching
    useEffect(() => {
        const tab = tabs.find(t => t.id === activeTabId) || tabs[0];
        if (tab) {
            setFiles(tab.files);
            setCrops(tab.crops);
            setCropSize(tab.settings.cropSize);
            setKeepRatio(tab.settings.keepRatio);
            setResizeOnExport(tab.settings.resizeOnExport);
            setLockMovement(tab.settings.lockMovement);
            setCenterCrop(tab.settings.centerCrop);
            setEnableOCR(tab.settings.enableOCR);
        }
    }, [activeTabId, tabs]);

    // Save current tab state
    const saveCurrentTabState = () => {
        setTabs(prev => prev.map(tab => 
            tab.id === activeTabId 
                ? {
                    ...tab,
                    files,
                    crops,
                    settings: {
                        cropSize,
                        keepRatio,
                        resizeOnExport,
                        lockMovement,
                        centerCrop,
                        enableOCR
                    }
                }
                : tab
        ));
    };

    // Auto-save tab state when values change (with debouncing to prevent excessive updates)
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            saveCurrentTabState();
        }, 100); // Debounce by 100ms

        return () => clearTimeout(timeoutId);
    }, [files, crops, cropSize, keepRatio, resizeOnExport, lockMovement, centerCrop, enableOCR]);

    const addNewTab = () => {
        const newTabId = `tab-${Date.now()}`;
        const newTab: CropTab = {
            id: newTabId,
            name: `Crop Session ${tabs.length + 1}`,
            files: [],
            crops: {},
            settings: {
                cropSize: null,
                keepRatio: true,
                resizeOnExport: true,
                lockMovement: false,
                centerCrop: false,
                enableOCR: true
            },
            isActive: true
        };

        setTabs(prev => [...prev.map(t => ({...t, isActive: false})), newTab]);
        setActiveTabId(newTabId);
    };

    const closeTab = (tabId: string) => {
        if (tabs.length === 1) return; // Don't close last tab

        setTabs(prev => {
            const filtered = prev.filter(t => t.id !== tabId);
            if (tabId === activeTabId && filtered.length > 0) {
                setActiveTabId(filtered[0].id);
            }
            return filtered;
        });
    };

    const startEditingTab = (tabId: string, currentName: string) => {
        setEditingTabId(tabId);
        setEditingTabName(currentName);
    };

    const saveTabName = () => {
        if (editingTabId && editingTabName.trim()) {
            setTabs(prev => prev.map(tab => 
                tab.id === editingTabId 
                    ? { ...tab, name: editingTabName.trim() }
                    : tab
            ));
        }
        setEditingTabId(null);
        setEditingTabName('');
    };

    const cancelEditingTab = () => {
        setEditingTabId(null);
        setEditingTabName('');
    };

    const onSetCropped = (index: number, croppedImage: any) => {
        setCroppedImages((prev: any) => ({ ...prev, [index]: croppedImage }));
    };

    const onSetFiles = (input: Array<any>) => {
        const allFiles = input ? Object.values(input) : [];
        // Filter only image files
        const imageFiles = allFiles.filter((file: File) => file.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        // Remove duplicates based on file name and size
        const uniqueFiles = imageFiles.filter((newFile: File) => {
            return !files.some((existingFile: File) => 
                existingFile.name === newFile.name && 
                existingFile.size === newFile.size &&
                existingFile.lastModified === newFile.lastModified
            );
        });

        console.log("set new files", { input, files, newFiles: uniqueFiles, filtered: imageFiles.length - uniqueFiles.length });

        if (uniqueFiles.length > 0) {
            setFiles(prev => [...prev, ...uniqueFiles]);
        }
    };

    const onRemoveImage = (index: number) => {
        console.log("remove", { index, files, croppedImages });
        setFiles(prev => prev.filter((_, i) => i !== index));
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
        });
    };

    // Selection handlers
    const toggleFileSelection = (index: number) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const handleMouseDown = (index: number) => {
        const timer = setTimeout(() => {
            toggleFileSelection(index);
        }, 1000); // 1 second hold
        setHoldTimer(timer);
    };

    const handleMouseUp = () => {
        if (holdTimer) {
            clearTimeout(holdTimer);
            setHoldTimer(null);
        }
    };

    const selectAllFiles = () => {
        setSelectedFiles(new Set(files.map((_, index) => index)));
    };

    const clearSelection = () => {
        setSelectedFiles(new Set());
    };

    useEffect(() => {
        if (files.length === 0 && inputRef?.current?.value) {
            inputRef.current.value = "";
        }
    }, [files]);

    const onSetAllToCrop = () => {
        setCrops((prevCrops: any) => {
            const newCrops: any = {};
            Object.keys(prevCrops).forEach(key => {
                newCrops[key] = { ...prevCrops[key], ...cropSize };
            });
            return newCrops;
        });
    };

    const onGlobalCropChange = (masterIndex: number, newCrop: any) => {
        if (!lockMovement) return;

        // Debounce rapid crop changes to prevent UI shaking
        const debouncedUpdate = () => {
            setCrops((prevCrops: any) => {
                const newCrops = { ...prevCrops };
                Object.keys(newCrops).forEach(key => {
                    if (key !== masterIndex.toString()) {
                        newCrops[key] = {
                            ...newCrops[key],
                            x: newCrop.x,
                            y: newCrop.y,
                            width: newCrop.width,
                            height: newCrop.height
                        };
                    }
                });
                return newCrops;
            });
        };

        // Clear any existing timeout and set a new one
        if (globalCropTimeout.current) {
            clearTimeout(globalCropTimeout.current);
        }
        globalCropTimeout.current = setTimeout(debouncedUpdate, 50);
    };

    const onCenterAllCrops = () => {
        setCrops((prevCrops: any) => {
            const newCrops = { ...prevCrops };
            Object.keys(newCrops).forEach(key => {
                const crop = newCrops[key];
                if (crop.image) {
                    const centerX = (crop.image.width - (crop.width || 100)) / 2;
                    const centerY = (crop.image.height - (crop.height || 100)) / 2;
                    newCrops[key] = {
                        ...crop,
                        x: Math.max(0, centerX),
                        y: Math.max(0, centerY)
                    };
                }
            });
            return newCrops;
        });
    };

    useEffect(() => {
        if (centerCrop) {
            onCenterAllCrops();
        }
    }, [centerCrop]);

    // Quality panel functions
    const applyImageTransformations = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        // Apply filter effects
        if (selectedFilter) {
            ctx.filter = selectedFilter.cssFilter;
        }

        // Apply adjustments if available
        if (adjustmentValues) {
            const filters = [];

            if (adjustmentValues.brightness !== 0) {
                filters.push(`brightness(${1 + adjustmentValues.brightness / 100})`);
            }
            if (adjustmentValues.contrast !== 0) {
                filters.push(`contrast(${1 + adjustmentValues.contrast / 100})`);
            }
            if (adjustmentValues.saturation !== 0) {
                filters.push(`saturate(${1 + adjustmentValues.saturation / 100})`);
            }
            if (adjustmentValues.hue !== 0) {
                filters.push(`hue-rotate(${adjustmentValues.hue}deg)`);
            }
            if (adjustmentValues.blur !== 0) {
                filters.push(`blur(${adjustmentValues.blur}px)`);
            }
            if (adjustmentValues.sharpen !== 0) {
                filters.push(`contrast(${1 + adjustmentValues.sharpen / 50})`);
            }

            if (filters.length > 0) {
                ctx.filter = (ctx.filter === 'none' ? '' : ctx.filter + ' ') + filters.join(' ');
            }
        }
    };

    const addWatermark = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        if (!enableWatermark || !watermarkText?.trim()) return;

        const fontSize = Math.max(canvas.width / 20, 16);
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 2;

        const textWidth = ctx.measureText(watermarkText).width;
        const x = canvas.width - textWidth - 20;
        const y = canvas.height - 20;

        ctx.strokeText(watermarkText, x, y);
        ctx.fillText(watermarkText, x, y);
    };

    const addBorder = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        if (!enableBorder || borderWidth <= 0) return;

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(borderWidth / 2, borderWidth / 2, canvas.width - borderWidth, canvas.height - borderWidth);
    };

    const addSignature = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        if (!enableSignature || !signatureText?.trim()) return;

        const fontSize = Math.max(canvas.width / 25, 12);
        ctx.font = `${fontSize}px cursive`;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1;

        const textWidth = ctx.measureText(signatureText).width;
        const x = 20;
        const y = canvas.height - 20;

        ctx.strokeText(signatureText, x, y);
        ctx.fillText(signatureText, x, y);
    };

    const handleAddWatermark = () => {
        const text = prompt('Enter watermark text:', watermarkText);
        if (text !== null) {
            setWatermarkText(text);
        }
    };

    const handleAddBorder = () => {
        const width = prompt('Enter border width (pixels):', borderWidth.toString());
        const color = prompt('Enter border color (hex):', borderColor);
        if (width !== null && !isNaN(parseInt(width))) {
            setBorderWidth(parseInt(width));
        }
        if (color !== null) {
            setBorderColor(color);
        }
    };

    const handleAddSignature = () => {
        const text = prompt('Enter signature text:', signatureText);
        if (text !== null) {
            setSignatureText(text);
        }
    };

    const handleShowPreview = () => {
        if (files.length > 0) {
            // Generate a preview with the first image
            const firstImageFile = files[0];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const img = new Image();
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                // Apply current effects
                let filterString = '';
                if (selectedFilter) {
                    filterString += selectedFilter.cssFilter;
                }
                if (adjustmentValues) {
                    const filters = [];
                    if (adjustmentValues.brightness !== 0) {
                        filters.push(`brightness(${1 + adjustmentValues.brightness / 100})`);
                    }
                    if (adjustmentValues.contrast !== 0) {
                        filters.push(`contrast(${1 + adjustmentValues.contrast / 100})`);
                    }
                    if (adjustmentValues.saturation !== 0) {
                        filters.push(`saturate(${1 + adjustmentValues.saturation / 100})`);
                    }
                    if (adjustmentValues.hue !== 0) {
                        filters.push(`hue-rotate(${adjustmentValues.hue}deg)`);
                    }
                    if (adjustmentValues.blur !== 0) {
                        filters.push(`blur(${adjustmentValues.blur}px)`);
                    }
                    if (adjustmentValues.sharpen !== 0) {
                        filters.push(`contrast(${1 + adjustmentValues.sharpen / 50})`);
                    }
                    filterString += (filterString ? ' ' : '') + filters.join(' ');
                }

                ctx.filter = filterString || 'none';
                ctx.drawImage(img, 0, 0);

                // Reset filter for overlays
                ctx.filter = 'none';

                // Add watermark
                addWatermark(canvas, ctx);

                // Add border
                addBorder(canvas, ctx);

                // Add signature
                addSignature(canvas, ctx);

                setPreviewImage(canvas.toDataURL());
                setShowPreviewPopup(true);
            };
            img.src = URL.createObjectURL(firstImageFile);
        } else {
            alert('Please add some images first to preview effects!');
        }
    };

    const generateQualityPreview = () => {
        // Use the first cropped image if available, otherwise create a sample
        const firstCropKey = Object.keys(crops)[0];

        if (firstCropKey && crops[firstCropKey]) {
            // Generate cropped image for preview
            const crop = crops[firstCropKey];
            const croppedImage = generateCroppedImage(crop, parseInt(firstCropKey));
            setQualityPreviewImage(croppedImage.dataUrl);
        } else if (files.length > 0) {
            // Fallback to original image if no crops exist yet
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const img = new Image();
                img.onload = () => {
                    canvas.width = Math.min(img.width, 400);
                    canvas.height = Math.min(img.height, 300);
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    setQualityPreviewImage(canvas.toDataURL());
                };
                img.src = URL.createObjectURL(files[0]);
            }
        } else {
            // Create sample image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = 400;
                canvas.height = 300;

                const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#ff7b7b');
                gradient.addColorStop(0.5, '#667eea');
                gradient.addColorStop(1, '#764ba2');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = 'white';
                ctx.font = '24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Sample Image', canvas.width / 2, canvas.height / 2 - 20);
                ctx.fillText('Quality Tools Preview', canvas.width / 2, canvas.height / 2 + 20);

                setQualityPreviewImage(canvas.toDataURL());
            }
        }
    };

    const applyQualityEffectsToPreview = () => {
        if (!qualityPreviewImage) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            // Apply current effects
            let filterString = '';
            if (selectedFilter) {
                filterString += selectedFilter.cssFilter;
            }
            if (adjustmentValues) {
                const filters = [];
                if (adjustmentValues.brightness !== 0) {
                    filters.push(`brightness(${1 + adjustmentValues.brightness / 100})`);
                }
                if (adjustmentValues.contrast !== 0) {
                    filters.push(`contrast(${1 + adjustmentValues.contrast / 100})`);
                }
                if (adjustmentValues.saturation !== 0) {
                    filters.push(`saturate(${1 + adjustmentValues.saturation / 100})`);
                }
                if (adjustmentValues.hue !== 0) {
                    filters.push(`hue-rotate(${adjustmentValues.hue}deg)`);
                }
                if (adjustmentValues.blur !== 0) {
                    filters.push(`blur(${adjustmentValues.blur}px)`);
                }
                if (adjustmentValues.sharpen !== 0) {
                    filters.push(`contrast(${1 + adjustmentValues.sharpen / 50})`);
                }
                filterString += (filterString ? ' ' : '') + filters.join(' ');
            }

            ctx.filter = filterString || 'none';
            ctx.drawImage(img, 0, 0);

            // Reset filter for overlays
            ctx.filter = 'none';

            // Add watermark
            addWatermark(canvas, ctx);

            // Add border
            addBorder(canvas, ctx);

            // Add signature
            addSignature(canvas, ctx);

            setPreviewImage(canvas.toDataURL());
        };
        img.src = qualityPreviewImage;
    };

    // Apply effects automatically when quality settings change
    useEffect(() => {
        if (qualityPreviewImage) {
            applyQualityEffectsToPreview();
        }
    }, [selectedFilter, adjustmentValues, watermarkText, borderWidth, borderColor, signatureText, enableWatermark, enableBorder, enableSignature, qualityPreviewImage]);

    // Auto-generate preview when quality panel opens
    useEffect(() => {
        if (showQualityPanel && !qualityPreviewImage) {
            generateQualityPreview();
        }
    }, [showQualityPanel]);

    // Add preview effects event listener
    useEffect(() => {
        const handlePreviewEffects = () => {
            handleShowPreview();
        };

        window.addEventListener('preview-effects', handlePreviewEffects);
        return () => window.removeEventListener('preview-effects', handlePreviewEffects);
    }, []);

    // Live update preview when effects change
    useEffect(() => {
        if (showQualityPanel && qualityPreviewImage) {
            const timeoutId = setTimeout(() => {
                applyQualityEffectsToPreview();
            }, 100);
            return () => clearTimeout(timeoutId);
        }
    }, [selectedFilter, adjustmentValues, enableWatermark, enableBorder, enableSignature, watermarkText, borderWidth, borderColor, signatureText]);

    const handleSaveAdjustments = () => {
        // Save original cropped images for undo functionality
        setOriginalCroppedImages({ ...croppedImages });

        const adjustmentData = {
            selectedFilter,
            adjustmentValues,
            watermarkText,
            borderWidth,
            borderColor,
            signatureText,
            enableWatermark,
            enableBorder,
            enableSignature,
            timestamp: Date.now()
        };

        localStorage.setItem('qualityToolsSettings', JSON.stringify(adjustmentData));

        // Apply effects to all cropped images immediately
        Object.keys(crops).forEach((key) => {
            const crop = crops[key];
            if (crop) {
                const enhancedImage = generateCroppedImage(crop, parseInt(key));
                setCroppedImages((prev: any) => ({
                    ...prev,
                    [key]: enhancedImage.dataUrl
                }));
            }
        });

        alert('Quality effects applied to all cropped images! Use Undo to revert changes.');
    };

    const handleUndoAdjustments = () => {
        if (Object.keys(originalCroppedImages).length > 0) {
            setCroppedImages(originalCroppedImages);
            setOriginalCroppedImages({});
            setSelectedFilter(null);
            setAdjustmentValues(null);
            setWatermarkText('WATERMARK');
            setBorderWidth(10);
            setBorderColor('#000000');
            setSignatureText('');
            setEnableWatermark(false);
            setEnableBorder(false);
            setEnableSignature(false);
            alert('Changes reverted to original cropped images!');
        } else {
            alert('No previous version to undo to!');
        }
    };

    const loadSavedAdjustments = () => {
        const saved = localStorage.getItem('qualityToolsSettings');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setSelectedFilter(data.selectedFilter);
                setAdjustmentValues(data.adjustmentValues);
                setWatermarkText(data.watermarkText || 'WATERMARK');
                setBorderWidth(data.borderWidth || 10);
                setBorderColor(data.borderColor || '#000000');
                setSignatureText(data.signatureText || '');
                setEnableWatermark(data.enableWatermark || false);
                setEnableBorder(data.enableBorder || false);
                setEnableSignature(data.enableSignature || false);
                alert('Quality tool settings loaded!');
            } catch (error) {
                console.error('Error loading saved settings:', error);
            }
        }
    };

    const handleSharePDF = async () => {
        try {
            const { jsPDF } = await import('jspdf');
            const indicesToShare = selectedFiles.size > 0 ? Array.from(selectedFiles) : Object.keys(crops).map(Number);

            if (indicesToShare.length === 0) {
                alert('Please crop some images first before sharing!');
                return;
            }

            const pdf = new jsPDF();
            let isFirstPage = true;

            for (let i = 0; i < indicesToShare.length; i++) {
                const index = indicesToShare[i];
                const crop = crops[index];
                if (!crop) continue;

                if (!isFirstPage) {
                    pdf.addPage();
                }
                isFirstPage = false;

                // Generate image with all quality effects applied
                const enhancedImage = generateCroppedImage(crop, index);

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                const imgAspectRatio = enhancedImage.canvas ? enhancedImage.canvas.width / enhancedImage.canvas.height : 1;
                const pageAspectRatio = pageWidth / pageHeight;

                let imgWidth, imgHeight;
                if (imgAspectRatio > pageAspectRatio) {
                    imgWidth = pageWidth - 20;
                    imgHeight = imgWidth / imgAspectRatio;
                } else {
                    imgHeight = pageHeight - 20;
                    imgWidth = imgHeight * imgAspectRatio;
                }

                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;

                pdf.addImage(enhancedImage.dataUrl, 'JPEG', x, y, imgWidth, imgHeight);
            }

            const pdfBlob = pdf.output('blob');

            if (navigator.share && navigator.canShare({ files: [new File([pdfBlob], 'enhanced-cropped-images.pdf', { type: 'application/pdf' })] })) {
                await navigator.share({
                    title: 'Enhanced Cropped Images',
                    text: 'Check out these enhanced cropped images!',
                    files: [new File([pdfBlob], 'enhanced-cropped-images.pdf', { type: 'application/pdf' })]
                });
            } else {
                // Fallback: create download link
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'enhanced-cropped-images.pdf';
                a.click();
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error sharing PDF:', error);
            alert('Error creating PDF. Please try again.');
        }
    };

    const generateCroppedImage = (crop: any, index: number) => {
        const resizeImageToCrop = resizeOnExport && cropSize != null && cropSize.width === cropSize.height ? cropSize : crop;
        const image = crop?.image;
        if (!image || !image.naturalWidth || !image.naturalHeight) {
            console.error('Invalid image data for crop:', crop, index);
            return {
                canvas: null,
                dataUrl: '',
                filename: `cropped_${String(index + 1).padStart(3, '0')}.png`
            };
        }
        const canvas = document.createElement("canvas");
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        const pixelRatio = Math.max(window.devicePixelRatio * 2, 4);
        canvas.width = resizeImageToCrop.width * pixelRatio;
        canvas.height = resizeImageToCrop.height * pixelRatio;

        const ctx: any = canvas.getContext("2d");

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.textRenderingOptimization = "optimizeQuality";

        ctx.scale(pixelRatio, pixelRatio);

        // Apply transformations before drawing
        applyImageTransformations(canvas, ctx);

        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            resizeImageToCrop.width,
            resizeImageToCrop.height
        );

        // Reset filter for overlays
        ctx.filter = 'none';

        // Add watermark if enabled
        if (enableWatermark && watermarkText && watermarkText.trim()) {
            addWatermark(canvas, ctx);
        }

        // Add border if enabled
        if (enableBorder && borderWidth > 0) {
            addBorder(canvas, ctx);
        }

        // Add signature if enabled
        if (enableSignature && signatureText && signatureText.trim()) {
            addSignature(canvas, ctx);
        }

        return {
            canvas,
            dataUrl: canvas.toDataURL("image/png"),
            filename: crop?.name || `cropped_${String(index + 1).padStart(3, '0')}.png`
        };
    };

    const onSaveCropped = () => {
        const indicesToSave = selectedFiles.size > 0 ? Array.from(selectedFiles) : Object.keys(crops).map(Number);

        indicesToSave.forEach((index: number) => {
            const crop = crops[index];
            if (crop) {
                const croppedImage = generateCroppedImage(crop, index);
                if (croppedImage.canvas && croppedImage.dataUrl) {
                    const link = document.createElement('a');
                    link.download = croppedImage.filename;
                    link.href = croppedImage.dataUrl;
                    link.click();
                } else {
                    console.warn(`Skipping image ${index} due to invalid data`);
                }
            }
        });
    };

    const onSaveAsZip = async () => {
        const jobId = `zip-${Date.now()}`;
        const indicesToSave = selectedFiles.size > 0 ? Array.from(selectedFiles) : Object.keys(crops).map(Number);

        const newJob: ProcessingJob = {
            id: jobId,
            name: `ZIP Export (${indicesToSave.length} images)`,
            progress: 0,
            total: indicesToSave.length,
            status: 'processing',
            type: 'zip',
            timestamp: Date.now()
        };

        setProcessingJobs(prev => [...prev, newJob]);

        try {
            const JSZip = (await import('jszip')).default;
            const zip = new JSZip();

            for (let i = 0; i < indicesToSave.length; i++) {
                const index = indicesToSave[i];
                const crop = crops[index];
                if (crop) {
                    try {
                        const croppedImage = generateCroppedImage(crop, index);
                        if (!croppedImage.canvas || !croppedImage.dataUrl) {
                            console.warn(`Skipping image ${index} due to invalid data`);
                            continue;
                        }
                        const base64Data = croppedImage.dataUrl.split(',')[1];
                        zip.file(croppedImage.filename, base64Data, { base64: true });

                        setProcessingJobs(prev => prev.map(job => 
                            job.id === jobId ? { ...job, progress: i + 1 } : job
                        ));
                    } catch (imageError) {
                        console.warn(`Failed to process image ${index}:`, imageError);
                    }
                }
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(zipBlob);
            link.download = `cropped_images_${new Date().toISOString().slice(0, 10)}.zip`;
            link.click();

            // Clean up URL after a delay
            setTimeout(() => {
                URL.revokeObjectURL(link.href);
            }, 100);

            setProcessingJobs(prev => prev.map(job => 
                job.id === jobId ? { ...job, status: 'completed', result: { filename: link.download } } : job
            ));

            // Add to history
            const historyItem: HistoryItem = {
                id: `history-${Date.now()}`,
                name: `ZIP Export - ${indicesToSave.length} images`,
                timestamp: Date.now(),
                files: files.filter((_, i) => indicesToSave.includes(i)),
                crops: Object.fromEntries(indicesToSave.map(i => [i, crops[i]]).filter(([_, crop]) => crop)),
                settings: { cropSize, keepRatio, resizeOnExport, lockMovement, centerCrop, enableOCR },
                exportedFiles: indicesToSave.map(i => crops[i] ? generateCroppedImage(crops[i], i) : null).filter(Boolean)
            };
            setHistory(prev => [historyItem, ...prev]);

        } catch (error) {
            console.error('Error creating ZIP:', error);
            setProcessingJobs(prev => prev.map(job => 
                job.id === jobId ? { ...job, status: 'error' } : job
            ));
        }
    };

    const onGeneratePDF = async () => {
        const jobId = `pdf-${Date.now()}`;
        const indicesToSave = selectedFiles.size > 0 ? Array.from(selectedFiles) : Object.keys(crops).map(Number);

        const newJob: ProcessingJob = {
            id: jobId,
            name: `PDF Export (${indicesToSave.length} images)`,
            progress: 0,
            total: indicesToSave.length,
            status: 'processing',
            type: 'pdf',
            timestamp: Date.now()
        };

        setProcessingJobs(prev => [...prev, newJob]);

        try {
            const { jsPDF } = await import('jspdf');
            const Tesseract = enableOCR ? await import('tesseract.js') : null;

            const pdf = new jsPDF();
            let isFirstPage = true;

            for (let i = 0; i < indicesToSave.length; i++) {
                const index = indicesToSave[i];
                const crop = crops[index];
                if (!crop) continue;

                try {
                    if (!isFirstPage) {
                        pdf.addPage();
                    }
                    isFirstPage = false;

                    const croppedImage = generateCroppedImage(crop, index);
                    if (!croppedImage.canvas) {
                        console.warn(`Skipping image ${index} due to invalid data`);
                        continue;
                    }
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();

                    const imgAspectRatio = croppedImage.canvas.width / croppedImage.canvas.height;
                    const pageAspectRatio = pageWidth / pageHeight;

                    let imgWidth, imgHeight;
                    if (imgAspectRatio > pageAspectRatio) {
                        imgWidth = pageWidth - 20;
                        imgHeight = imgWidth / imgAspectRatio;
                    } else {
                        imgHeight = pageHeight - 20;
                        imgWidth = imgHeight * imgAspectRatio;
                    }

                    const x = (pageWidth - imgWidth) / 2;
                    const y = (pageHeight - imgHeight) / 2;

                    pdf.addImage(croppedImage.dataUrl, 'JPEG', x, y, imgWidth, imgHeight);

                    if (enableOCR && Tesseract) {
                        try {
                            console.log(`Performing OCR on image ${index + 1}...`);
                            const ocrResult = await Tesseract.recognize(croppedImage.canvas, 'eng', {
                                logger: () => {} // Suppress OCR logs to reduce console noise
                            });
                            const extractedText = ocrResult.data.text.trim();

                            if (extractedText && extractedText.length > 0) {
                                const cleanText = extractedText.replace(/\s+/g, ' ').trim();
                                pdf.setFontSize(8);
                                pdf.setTextColor(0, 0, 0, 0.01);

                                const maxCharsPerLine = 80;
                                const lines = [];
                                const words = cleanText.split(' ');
                                let currentLine = '';

                                words.forEach(word => {
                                    if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
                                        currentLine += (currentLine ? ' ' : '') + word;
                                    } else {
                                        if (currentLine) lines.push(currentLine);
                                        currentLine = word;
                                    }
                                });
                                if (currentLine) lines.push(currentLine);

                                lines.forEach((line, lineIndex) => {
                                    const textX = x;
                                    const textY = y + 10 + (lineIndex * 8);
                                    if (textY < pageHeight - 10) {
                                        pdf.text(line, textX, textY);
                                    }
                                });
                            }
                        } catch (ocrError) {
                            console.warn(`OCR failed for image ${index + 1}:`, ocrError);
                        }
                    }
                } catch (imageError) {
                    console.warn(`Failed to process image ${index}:`, imageError);
                }

                setProcessingJobs(prev => prev.map(job => 
                    job.id === jobId ? { ...job, progress: i + 1 } : job
                ));
            }

            const tabName = activeTab.name.replace(/[^a-zA-Z0-9-_]/g, '_');
            const filename = `${tabName}_${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(filename);

            setProcessingJobs(prev => prev.map(job => 
                job.id === jobId ? { ...job, status: 'completed', result: { filename } } : job
            ));

            // Add to history
            const historyItem: HistoryItem = {
                id: `history-${Date.now()}`,
                name: `PDF Export - ${indicesToSave.length} images`,
                timestamp: Date.now(),
                files: files.filter((_, i) => indicesToSave.includes(i)),
                crops: Object.fromEntries(indicesToSave.map(i => [i, crops[i]]).filter(([_, crop]) => crop)),
                settings: { cropSize, keepRatio, resizeOnExport, lockMovement, centerCrop, enableOCR },
                exportedFiles: indicesToSave.map(i => crops[i] ? generateCroppedImage(crops[i], i) : null).filter(Boolean)
            };
            setHistory(prev => [historyItem, ...prev]);

        } catch (error) {
            console.error('Error creating PDF:', error);
            setProcessingJobs(prev => prev.map(job => 
                job.id === jobId ? { ...job, status: 'error' } : job
            ));
        }
    };

    const removeProcessingJob = (jobId: string) => {
        setProcessingJobs(prev => prev.filter(job => job.id !== jobId));
    };

    const loadFromHistory = (historyItem: HistoryItem) => {
        const newTabId = `tab-${Date.now()}`;
        const newTab: CropTab = {
            id: newTabId,
            name: `Restored: ${historyItem.name}`,
            files: historyItem.files,
            crops: historyItem.crops,
            settings: historyItem.settings,
            isActive: true
        };

        setTabs(prev => [...prev.map(t => ({...t, isActive: false})), newTab]);
        setActiveTabId(newTabId);
        setCurrentView('crop');
    };

    const deleteHistoryItem = (historyId: string) => {
        setHistory(prev => prev.filter(item => item.id !== historyId));
    };

    const onSelectSomeFiles = () => {
        inputRef?.current?.click();
    };

    const onSelectFolder = () => {
        folderInputRef?.current?.click();
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'o':
                        e.preventDefault();
                        onSelectSomeFiles();
                        break;
                    case 'f':
                        e.preventDefault();
                        onSelectFolder();
                        break;
                    case 'a':
                        e.preventDefault();
                        selectAllFiles();
                        break;
                    case 'e':
                        e.preventDefault();
                        if (Object.keys(crops).length > 0) onSaveCropped();
                        break;
                    case 'z':
                        e.preventDefault();
                        if (Object.keys(crops).length > 0) onSaveAsZip();
                        break;
                    case 'p':
                        e.preventDefault();
                        if (Object.keys(crops).length > 0) onGeneratePDF();
                        break;
                }
            }
            if (e.key === 'Escape') {
                clearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [crops]);

    // Calculate total file size
    const getTotalFileSize = () => {
        const totalBytes = files.reduce((sum, file) => sum + (file.size || 0), 0);
        if (totalBytes < 1024) return `${totalBytes} B`;
        if (totalBytes < 1024 * 1024) return `${(totalBytes / 1024).toFixed(1)} KB`;
        return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Arrow-based movement functions
    const moveImage = (fromIndex: number, direction: 'up' | 'down' | 'left' | 'right') => {
        if (!rearrangeMode || files.length < 2) return;

        let toIndex = fromIndex;

        if (gridView) {
            // For grid view, calculate columns based on container width
            const containerWidth = window.innerWidth - 32; // Account for padding
            const itemWidth = 300 + 8; // Min width + gap
            const columns = Math.floor(containerWidth / itemWidth) || 1;

            switch (direction) {
                case 'up':
                    toIndex = Math.max(0, fromIndex - columns);
                    break;
                case 'down':
                    toIndex = Math.min(files.length - 1, fromIndex + columns);
                    break;
                case 'left':
                    toIndex = Math.max(0, fromIndex - 1);
                    break;
                case 'right':
                    toIndex = Math.min(files.length - 1, fromIndex + 1);
                    break;
            }
        } else {
            // For single row view
            switch (direction) {
                case 'left':
                case 'up':
                    toIndex = Math.max(0, fromIndex - 1);
                    break;
                case 'right':
                case 'down':
                    toIndex = Math.min(files.length - 1, fromIndex + 1);
                    break;
            }
        }

        if (toIndex !== fromIndex) {
            const newFiles = [...files];
            const itemToMove = newFiles[fromIndex];
            newFiles.splice(fromIndex, 1);
            newFiles.splice(toIndex, 0, itemToMove);

            // Update crops and selected files with the new arrangement
            const newCrops: any = {};
            const newSelectedFiles = new Set<number>();

            // Create mapping for the swap
            const indexMapping: { [key: number]: number } = {};
            for (let i = 0; i < files.length; i++) {
                if (i === fromIndex) {
                    indexMapping[i] = toIndex;
                } else if (fromIndex < toIndex && i > fromIndex && i <= toIndex) {
                    indexMapping[i] = i - 1;
                } else if (fromIndex > toIndex && i >= toIndex && i < fromIndex) {
                    indexMapping[i] = i + 1;
                } else {
                    indexMapping[i] = i;
                }
            }

            // Apply mapping to crops
            Object.entries(crops).forEach(([oldIndex, cropData]) => {
                const oldIdx = parseInt(oldIndex);
                const newIdx = indexMapping[oldIdx];
                if (newIdx !== undefined && cropData) {
                    newCrops[newIdx] = cropData;
                }
            });

            // Apply mapping to selected files
            selectedFiles.forEach(oldIdx => {
                const newIdx = indexMapping[oldIdx];
                if (newIdx !== undefined) {
                    newSelectedFiles.add(newIdx);
                }
            });

            setFiles(newFiles);
            setCrops(newCrops);
            setSelectedFiles(newSelectedFiles);
        }
    };

    const toggleRearrangeMode = () => {
        setRearrangeMode(!rearrangeMode);
        if (rearrangeMode) {
            // Save arrangement when exiting rearrange mode
            saveCurrentTabState();
        }
    };

    const getProcessedCount = () => {
        return Object.keys(crops).filter(key => crops[key]?.width && crops[key]?.height).length;
    };

    return (
        <div style={{overflow: "auto", width: "100%", height: "100vh",
            padding: "0 0 4 0",
            background: "repeating-linear-gradient(45deg, rgb(10 10 10 / 90%), rgb(5 5 5 / 90%) 3px, rgb(0 0 0 / 90%) 3px, rgb(0 0 0 / 90%) 6px)"
        }}>
            {/* Tab Bar */}
            <div style={{
                display: "flex", 
                gap: "2px", 
                padding: "5px", 
                background: "rgba(0,0,0,0.8)", 
                borderBottom: "1px solid #333",
                overflowX: "auto"
            }}>
                {tabs.map(tab => (
                    <div key={tab.id} style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "5px 10px",
                        background: tab.id === activeTabId ? "#444" : "#222",
                        color: "white",
                        borderRadius: "3px",
                        whiteSpace: "nowrap"
                    }}>
                        {editingTabId === tab.id ? (
                            <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
                                <input
                                    type="text"
                                    value={editingTabName}
                                    onChange={(e) => setEditingTabName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveTabName();
                                        if (e.key === 'Escape') cancelEditingTab();
                                    }}
                                    onBlur={saveTabName}
                                    autoFocus
                                    style={{
                                        background: "#555",
                                        border: "1px solid #777",
                                        color: "white",
                                        padding: "2px 5px",
                                        fontSize: "12px",
                                        width: "120px"
                                    }}
                                />
                                <button onClick={saveTabName} style={{ background: "none", border: "none", color: "#4CAF50", fontSize: "10px" }}>✓</button>
                                <button onClick={cancelEditingTab} style={{ background: "none", border: "none", color: "#f44336", fontSize: "10px" }}>✕</button>
                            </div>
                        ) : (
                            <>
                                <span 
                                    onClick={() => setActiveTabId(tab.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {tab.name}
                                </span>
                                <button 
                                    onClick={() => startEditingTab(tab.id, tab.name)}
                                    style={{
                                        background: "none", 
                                        border: "none", 
                                        color: "#888", 
                                        cursor: "pointer",
                                        fontSize: "10px"
                                    }}
                                    title="Edit tab name"
                                >
                                    ✏️
                                </button>
                                {tabs.length > 1 && (
                                    <button 
                                        onClick={() => closeTab(tab.id)}
                                        style={{
                                            background: "none", 
                                            border: "none", 
                                            color: "#888", 
                                            cursor: "pointer",
                                            fontSize: "12px"
                                        }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                ))}
                <button 
                    onClick={addNewTab}
                    style={{
                        background: "#333", 
                        border: "none", 
                        color: "white", 
                        padding: "5px 10px",
                        borderRadius: "3px",
                        cursor: "pointer"
                    }}
                >
                    + New Tab
                </button>
            </div>

            {/* View Toggle */}
            <div style={{
                display: "flex", 
                gap: "5px", 
                padding: "5px", 
                background: "rgba(0,0,0,0.6)"
            }}>
                <button 
                    onClick={() => setCurrentView('crop')}
                    className={currentView === 'crop' ? 'export-button' : 'button'}
                >
                    🖼️ Cropping
                </button>
                <button 
                    onClick={() => setCurrentView('history')}
                    className={currentView === 'history' ? 'export-button' : 'button'}
                >
                    📜 History ({history.length})
                </button>
            </div>

            {/* Background Processing Jobs */}
            {processingJobs.length > 0 && (
                <div style={{
                    padding: "10px",
                    background: "rgba(0,0,0,0.8)",
                    color: "white"
                }}>
                    <h4>Background Processing:</h4>
                    {processingJobs.map(job => (
                        <div key={job.id} style={{
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center",
                            padding: "5px",
                            background: "rgba(255,255,255,0.1)",
                            margin: "2px 0",
                            borderRadius: "3px"
                        }}>
                            <span>{job.name}</span>
                            <div style={{display: "flex", alignItems: "center", gap: "10px"}}>
                                {job.status === 'processing' && (
                                    <span>{job.progress}/{job.total}</span>
                                )}
                                <span>{job.status}</span>
                                <button onClick={() => removeProcessingJob(job.id)}>✕</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* History View */}
            {currentView === 'history' && (
                <div style={{ padding: "20px", color: "white" }}>
                    <h2>Export History</h2>
                    {history.length === 0 ? (
                        <p>No exports yet. Create some crops and export them to see history.</p>
                    ) : (
                        <div style={{ display: "grid", gap: "10px" }}>
                            {history.map(item => (
                                <div key={item.id} style={{
                                    padding: "15px",
                                    background: "rgba(255,255,255,0.1)",
                                    borderRadius: "5px",
                                    border: "1px solid #333"
                                }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <h4>{item.name}</h4>
                                            <p style={{ fontSize: "12px", color: "#ccc" }}>
                                                {new Date(item.timestamp).toLocaleString()} • {item.files.length} images
                                            </p>
                                        </div>
                                        <div style={{ display: "flex", gap: "5px" }}>
                                            <button onClick={() => loadFromHistory(item)} className="button">
                                                🔄 Restore & Edit
                                            </button>
                                            <button onClick={() => deleteHistoryItem(item.id)} className="circle-button">
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Cropping View */}
            {currentView === 'crop' && (
                <>
                    <div className={files.length > 0 ? "top-header" : undefined} style={{display: "flex", justifyContent: "space-between", position: "sticky", top: 0, left: 0, zIndex: 999}}>
                        <div style={{display: "flex", justifyContent: "space-between", gap: 6, position: "relative"}}>
                            {files.length > 0 && (
                                <>
                                    <div title={`${files.length} files • ${getTotalFileSize()} • ${getProcessedCount()} cropped`}>
                                        📊 {files.length} files ({getTotalFileSize()}) • ✂️ {getProcessedCount()} cropped
                                    </div>
                                    <button onClick={onSelectSomeFiles} className="button" title="Ctrl+O">Add Files</button>
                                    <button onClick={onSelectFolder} className="button" title="Ctrl+F">📁 Add Folder</button>
                                    {selectedFiles.size > 0 && (
                                        <>
                                            <div style={{color: "#4CAF50"}}>✓ {selectedFiles.size} selected</div>
                                            <button onClick={selectAllFiles} className="button" title="Ctrl+A">Select All</button>
                                            <button onClick={clearSelection} className="button" title="Escape">Clear</button>
                                        </>
                                    )}
                                </>
                            )}
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e: any) => {
                                    onSetFiles(e.target.files);
                                }}
                                ref={inputRef}
                                className="file-input"
                                style={{display: "none"}}
                            />
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                {...({ webkitdirectory: "" } as any)}
                                onChange={(e: any) => {
                                    onSetFiles(e.target.files);
                                }}
                                ref={folderInputRef}
                                className="file-input"
                                style={{display: "none"}}
                            />
                        </div>
                        {files.length > 0 && (
                            <div style={{display: "flex", justifyContent: "space-between", gap: 4, height: "fit-content", alignItems: "center", flexWrap: "wrap"}} className="exporter-settings">
                                <div style={{display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap"}}>
                                    <button onClick={onSetAllToCrop}>Set all to</button>
                                    <Select selectItems={cropSizePresets} selectId="crop-presets" onSelect={setCropSize}/>
                                    <div onClick={()=> setKeepRatio((prev:boolean) => !prev)} className="checkbox">
                                        <input type="checkbox" checked={keepRatio} readOnly />
                                        <div className="box-bg">Keep ratio</div>
                                    </div>
                                    <div onClick={()=> setLockMovement((prev:boolean) => !prev)} className="checkbox" title="Sync crop changes across all images">
                                        <input type="checkbox" checked={lockMovement} readOnly />
                                        <div className="box-bg">🔒 Lock Movement</div>
                                    </div>
                                    <div onClick={()=> setCenterCrop((prev:boolean) => !prev)} className="checkbox" title="Center crop on all images">
                                        <input type="checkbox" checked={centerCrop} readOnly />
                                        <div className="box-bg">🎯 Center Crop</div>
                                    </div>
                                    <div onClick={toggleRearrangeMode} className="checkbox" title="Enable drag to rearrange image order">
                                        <input type="checkbox" checked={rearrangeMode} readOnly />
                                        <div className="box-bg">🔄 Rearrange</div>
                                    </div>
                                    <button 
                                        className={`quality-toggle-btn ${showQualityPanel ? 'active' : ''}`}
                                        onClick={() => {
                                            setShowQualityPanel(!showQualityPanel);
                                            if (!showQualityPanel) {
                                                // Auto-generate preview when opening quality tools
                                                generateQualityPreview();
                                            }
                                        }}
                                        title="Open Quality Tools - Draggable & Resizable"
                                        style={{
                                            background: showQualityPanel ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                                            color: "white",
                                            border: "none",
                                            padding: "8px 16px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                            transition: "all 0.3s ease"
                                        }}
                                    >
                                        🎛️ Quality Tools
                                    </button>
                                </div>



                                <div style={{display: "flex", gap: 4, alignItems: "center"}}>
                                    <div onClick={()=> setEnableOCR((prev:boolean) => !prev)} className="checkbox" title="Enable OCR for PDF searchable text">
                                        <input type="checkbox" checked={enableOCR} readOnly />
                                        <div className="box-bg">🔍 Enable OCR</div>
                                    </div>
                                    <div onClick={()=> setGridView((prev:boolean) => !prev)} className="checkbox" title="Toggle between grid and single view">
                                        <input type="checkbox" checked={gridView} readOnly />
                                        <div className="box-bg">📱 Grid View</div>
                                    </div>
                                </div>

                                <div style={{display: "flex", gap: 4, alignItems: "center"}}>
                                    {cropSize && keepRatio && (
                                        <div onClick={()=> setResizeOnExport((prev:boolean) => !prev)} className="checkbox" title="This will resize the exported images when on">
                                            <input type="checkbox" checked={resizeOnExport} readOnly />
                                            <div className="box-bg">Resize to {cropSize.width}x{cropSize.height}</div>
                                        </div>
                                    )}
                                    <button onClick={onSaveCropped} className="export-button" title="Ctrl+E">
                                        📷 Export {selectedFiles.size > 0 ? `Selected (${selectedFiles.size})` : 'All'}
                                    </button>
                                    <button onClick={onSaveAsZip} className="export-button" title="Ctrl+Z">
                                        📦 ZIP {selectedFiles.size > 0 ? `Selected (${selectedFiles.size})` : 'All'}
                                    </button>
                                    <button onClick={onGeneratePDF} className="export-button" title="Ctrl+P">
                                        📄 PDF {selectedFiles.size > 0 ? `Selected (${selectedFiles.size})` : 'All'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Beautiful Separator Line */}
                    {files.length > 0 && (
                        <div style={{
                            height: '3px',
                            background: 'linear-gradient(90deg, transparent 0%, #4CAF50 15%, #2196F3 35%, #FF5722 55%, #9C27B0 75%, transparent 100%)',
                            margin: '10px 20px',
                            borderRadius: '2px',
                            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-5px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '100px',
                                height: '13px',
                                background: 'linear-gradient(90deg, #4CAF50, #2196F3, #FF5722)',
                                borderRadius: '10px',
                                opacity: 0.8,
                                animation: 'pulse 2s ease-in-out infinite alternate'
                            }} />
                        </div>
                    )}

                    <div>
                        <div style={{
                            display: gridView ? "grid" : "flex", 
                            gridTemplateColumns: gridView ? "repeat(auto-fit, minmax(300px, 1fr))" : "none",
                            flexWrap: gridView ? "nowrap" : "wrap", 
                            gap: "0.5rem", 
                            padding: "0.5rem", 
                            color: "white",
                            maxWidth: gridView ? "none" : "none",
                            margin: gridView ? "0" : "0",
                            height: gridView ? "calc(100vh - 200px)" : "auto",
                            overflowY: gridView ? "auto" : "visible"
                        }}>
                            {files.length === 0 && (
                                <About aboutText={aboutText} appName={appName}>
                                    <div style={{display: "flex", flexDirection: "column", gap: "10px", alignItems: "center"}}>
                                        <h1 onClick={onSelectSomeFiles}
                                            className="select-some-files"
                                        >📸 Select some files (supports 100+ images)</h1>
                                        <h2 onClick={onSelectFolder}
                                            className="select-some-files"
                                            style={{fontSize: "1.2em", margin: "10px 0"}}
                                        >📁 Or select a folder with images</h2>

                                        <div style={{
                                            background: "rgba(0,0,0,0.7)", 
                                            padding: "15px", 
                                            borderRadius: "8px", 
                                            marginTop: "20px",
                                            border: "1px solid #333"
                                        }}>
                                            <h3 style={{color: "#4CAF50", marginBottom: "10px"}}>⌨️ Keyboard Shortcuts</h3>
                                            <div style={{fontSize: "0.9em", color: "#ccc", textAlign: "left"}}>
                                                <div>• <strong>Ctrl+O</strong> - Open Files</div>
                                                <div>• <strong>Ctrl+F</strong> - Open Folder</div>
                                                <div>• <strong>Ctrl+A</strong> - Select All</div>
                                                <div>• <strong>Ctrl+E</strong> - Export Images</div>
                                                <div>• <strong>Ctrl+Z</strong> - Export as ZIP</div>
                                                <div>• <strong>Ctrl+P</strong> - Export as PDF</div>
                                                <div>• <strong>Escape</strong> - Clear Selection</div>
                                            </div>
                                        </div>
                                    </div>
                                </About>
                            )}
                            {files
                                .map((file, actualIndex) => {
                                    const isSelected = selectedFiles.has(actualIndex);
                                return file && (
                                    <div key={file?.name + actualIndex} 
                                         style={{
                                             position: "relative",
                                             border: isSelected ? "3px solid #4CAF50" : rearrangeMode && draggedIndex === actualIndex ? "3px solid #2196F3" : rearrangeMode ? "2px dashed #888" : "none",
                                             borderRadius: "0.5rem",
                                             cursor: rearrangeMode ? "grab" : "default",
                                             opacity: rearrangeMode && draggedIndex === actualIndex ? 0.5 : 1,
                                             transform: rearrangeMode && draggedIndex === actualIndex ? "scale(0.95)" : "scale(1)",
                                             transition: "all 0.2s ease",
                                             background: rearrangeMode ? "rgba(33, 150, 243, 0.1)" : "transparent"
                                         }}
                                         onMouseDown={(e) => {
                                             if (!rearrangeMode) {
                                                 handleMouseDown(actualIndex);
                                             }
                                         }}
                                         onMouseUp={() => {
                                             if (!rearrangeMode) {
                                                 handleMouseUp();
                                             }
                                         }}
                                         onMouseLeave={() => {
                                             if (!rearrangeMode) {
                                                 handleMouseUp();
                                             }
                                         }}
                                    >
                                        {isSelected && !rearrangeMode && (
                                            <div style={{
                                                position: "absolute",
                                                top: "5px",
                                                right: "5px",
                                                background: "#4CAF50",
                                                color: "white",
                                                borderRadius: "50%",
                                                width: "25px",
                                                height: "25px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                zIndex: 100,
                                                fontSize: "14px"
                                            }}>
                                                ✓
                                            </div>
                                        )}

                                        {/* Directional Arrow Controls for Rearrange Mode */}
                                        {rearrangeMode && (
                                            <div style={{
                                                position: "absolute",
                                                top: "50%",
                                                left: "50%",
                                                transform: "translate(-50%, -50%)",
                                                zIndex: 200,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                gap: "2px",
                                                background: "rgba(0, 0, 0, 0.8)",
                                                borderRadius: "8px",
                                                padding: "8px",
                                                border: "2px solid #2196F3"
                                            }}>
                                                {/* Up Arrow */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveImage(actualIndex, 'up');
                                                    }}
                                                    style={{
                                                        background: "linear-gradient(135deg, #2196F3, #1976D2)",
                                                        border: "none",
                                                        color: "white",
                                                        width: "32px",
                                                        height: "32px",
                                                        borderRadius: "6px",
                                                        cursor: "pointer",
                                                        fontSize: "16px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = "scale(1.1)";
                                                        e.currentTarget.style.background = "linear-gradient(135deg, #1976D2, #1565C0)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = "scale(1)";
                                                        e.currentTarget.style.background = "linear-gradient(135deg, #2196F3, #1976D2)";
                                                    }}
                                                    title="Move Up"
                                                >
                                                    ↑
                                                </button>

                                                {/* Left and Right Arrows Row */}
                                                <div style={{ display: "flex", gap: "2px" }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            moveImage(actualIndex, 'left');
                                                        }}
                                                        style={{
                                                            background: "linear-gradient(135deg, #2196F3, #1976D2)",
                                                            border: "none",
                                                            color: "white",
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "6px",
                                                            cursor: "pointer",
                                                            fontSize: "16px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                                            transition: "all 0.2s ease"
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = "scale(1.1)";
                                                            e.currentTarget.style.background = "linear-gradient(135deg, #1976D2, #1565C0)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = "scale(1)";
                                                            e.currentTarget.style.background = "linear-gradient(135deg, #2196F3, #1976D2)";
                                                        }}
                                                        title="Move Left"
                                                    >
                                                        ←
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            moveImage(actualIndex, 'right');
                                                        }}
                                                        style={{
                                                            background: "linear-gradient(135deg, #2196F3, #1976D2)",
                                                            border: "none",
                                                            color: "white",
                                                            width: "32px",
                                                            height: "32px",
                                                            borderRadius: "6px",
                                                            cursor: "pointer",
                                                            fontSize: "16px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                                            transition: "all 0.2s ease"
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.transform = "scale(1.1)";
                                                            e.currentTarget.style.background = "linear-gradient(135deg, #1976D2, #1565C0)";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.transform = "scale(1)";
                                                            e.currentTarget.style.background = "linear-gradient(135deg, #2196F3, #1976D2)";
                                                        }}
                                                        title="Move Right"
                                                    >
                                                        →
                                                    </button>
                                                </div>

                                                {/* Down Arrow */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveImage(actualIndex, 'down');
                                                    }}
                                                    style={{
                                                        background: "linear-gradient(135deg, #2196F3, #1976D2)",
                                                        border: "none",
                                                        color: "white",
                                                        width: "32px",
                                                        height: "32px",
                                                        borderRadius: "6px",
                                                        cursor: "pointer",
                                                        fontSize: "16px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = "scale(1.1)";
                                                        e.currentTarget.style.background = "linear-gradient(135deg, #1976D2, #1565C0)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = "scale(1)";
                                                        e.currentTarget.style.background = "linear-gradient(135deg, #2196F3, #1976D2)";
                                                    }}
                                                    title="Move Down"
                                                >
                                                    ↓
                                                </button>
                                            </div>
                                        )}
                                        <div style={{ 
                                            pointerEvents: rearrangeMode ? 'none' : 'auto',
                                            opacity: rearrangeMode ? 0.7 : 1,
                                            transition: 'opacity 0.3s ease'
                                        }}>
                                            <Cropper
                                                cropSize={cropSize}
                                                file={file}
                                                index={actualIndex}
                                                onSetCropped={onSetCropped}
                                                onRemoveImage={onRemoveImage}
                                                crops={crops}
                                                setCrops={setCrops}
                                                keepRatio={keepRatio}
                                                lockMovement={lockMovement}
                                                centerCrop={centerCrop}
                                                onGlobalCropChange={onGlobalCropChange}
                                                rearrangeMode={rearrangeMode}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                            }
                        </div>
                    </div>
                </>
            )}

            {/* Floating Preview Window */}
            {showFloatingPreview && previewImage && (
                <div 
                    style={{
                        position: 'fixed',
                        left: `${previewPosition.x}px`,
                        top: `${previewPosition.y}px`,
                        width: `${previewSize.width}px`,
                        height: `${previewSize.height}px`,
                        background: 'white',
                        border: '2px solid #007bff',
                        borderRadius: '10px',
                        zIndex: 10000,
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        minWidth: '250px',
                        minHeight: '200px'
                    }}
                >
                    <div 
                        style={{
                            background: '#007bff',
                            color: 'white',
                            padding: '5px 10px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'move',
                            fontSize: '12px'
                        }}
                        onMouseDown={(e) => {
                            if (isResizing) return;
                            const startX = e.clientX - previewPosition.x;
                            const startY = e.clientY - previewPosition.y;

                            const handleMouseMove = (e: MouseEvent) => {
                                setPreviewPosition({
                                    x: e.clientX - startX,
                                    y: e.clientY - startY
                                });
                            };

                            const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                            };

                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                        }}
                    >
                        <span>🖼️ Live Preview</span>
                        <button 
                            onClick={() => setShowFloatingPreview(false)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Navigation buttons */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '5px',
                        background: 'rgba(0, 123, 255, 0.1)',
                        gap: '10px'
                    }}>
                        <button
                            onClick={() => {
                                const croppedKeys = Object.keys(crops).filter(key => crops[key] && crops[key].width && crops[key].height);
                                if (croppedKeys.length > 0) {
                                    const currentIndex = croppedKeys.findIndex(key => {
                                        const crop = crops[key];
                                        const currentImage = generateCroppedImage(crop, parseInt(key));
                                        return currentImage.dataUrl === previewImage;
                                    });
                                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : croppedKeys.length - 1;
                                    const prevKey = croppedKeys[prevIndex];
                                    const prevCrop = crops[prevKey];
                                    if (prevCrop) {
                                        const prevImage = generateCroppedImage(prevCrop, parseInt(prevKey));
                                        setPreviewImage(prevImage.dataUrl);
                                    }
                                }
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                                border: 'none',
                                color: 'white',
                                padding: '8px 12px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                            }}
                            title="Previous Image"
                        >
                            <<<<<<
                        </button>

                        <span style={{
                            fontSize: '12px',
                            color: '#007bff',
                            fontWeight: 'bold'
                        }}>
                            {(() => {
                                const croppedKeys = Object.keys(crops).filter(key => crops[key] && crops[key].width && crops[key].height);
                                if (croppedKeys.length > 0) {
                                    const currentIndex = croppedKeys.findIndex(key => {
                                        const crop = crops[key];
                                        const currentImage = generateCroppedImage(crop, parseInt(key));
                                        return currentImage.dataUrl === previewImage;
                                    });
                                    return `${currentIndex + 1}/${croppedKeys.length}`;
                                }
                                return '1/1';
                            })()}
                        </span>

                        <button
                            onClick={() => {
                                const croppedKeys = Object.keys(crops).filter(key => crops[key] && crops[key].width && crops[key].height);
                                if (croppedKeys.length > 0) {
                                    const currentIndex = croppedKeys.findIndex(key => {
                                        const crop = crops[key];
                                        const currentImage = generateCroppedImage(crop, parseInt(key));
                                        return currentImage.dataUrl === previewImage;
                                    });
                                    const nextIndex = currentIndex < croppedKeys.length - 1 ? currentIndex + 1 : 0;
                                    const nextKey = croppedKeys[nextIndex];
                                    const nextCrop = crops[nextKey];
                                    if (nextCrop) {
                                        const nextImage = generateCroppedImage(nextCrop, parseInt(nextKey));
                                        setPreviewImage(nextImage.dataUrl);
                                    }
                                }
                            }}
                            style={{
                                background: 'linear-gradient(135deg, #FF5722, #E64A19)',
                                border: 'none',
                                color: 'white',
                                padding: '8px 12px',
                                borderRadius: '20px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                            }}
                            title="Next Image"
                        >
                            >>>>>>
                        </button>
                    </div>

                    <div style={{ padding: '10px', height: 'calc(100% - 90px)', overflow: 'hidden', position: 'relative' }}>
                        <img 
                            src={previewImage} 
                            alt="Floating preview"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain'
                            }}
                        />
                        {/* Resize Handle with Arrow */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '5px',
                                right: '5px',
                                width: '30px',
                                height: '30px',
                                background: 'rgba(0, 123, 255, 0.9)',
                                cursor: 'nw-resize',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '16px',
                                border: '2px solid white',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                                transition: 'all 0.2s ease',
                                userSelect: 'none'
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setIsResizing(true);
                                const startX = e.clientX;
                                const startY = e.clientY;
                                const startWidth = previewSize.width;
                                const startHeight = previewSize.height;

                                const handleMouseMove = (e: MouseEvent) => {
                                    const deltaX = e.clientX - startX;
                                    const deltaY = e.clientY - startY;
                                    const newWidth = Math.max(250, startWidth + deltaX);
                                    const newHeight = Math.max(200, startHeight + deltaY);
                                    setPreviewSize({ width: newWidth, height: newHeight });
                                };

                                const handleMouseUp = () => {
                                    setIsResizing(false);
                                    document.removeEventListener('mousemove', handleMouseMove);
                                    document.removeEventListener('mouseup', handleMouseUp);
                                };

                                document.addEventListener('mousemove', handleMouseMove);
                                document.addEventListener('mouseup', handleMouseUp);
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.1)';
                                e.currentTarget.style.background = 'rgba(0, 123, 255, 1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.background = 'rgba(0, 123, 255, 0.9)';
                            }}
                            title="Drag to resize preview window"
                        >
                            ⤡
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Popup Modal */}
            {showPreviewPopup && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '10px',
                        maxWidth: '90%',
                        maxHeight: '90%',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}>
                        <button 
                            onClick={() => setShowPreviewPopup(false)}
                            style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                background: '#ff4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50%',
                                width: '30px',
                                height: '30px',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                        >
                            ✕
                        </button>
                        <h3 style={{ color: 'black', marginBottom: '15px' }}>Quality Tools Preview</h3>
                        <img 
                            src={previewImage} 
                            alt="Preview with effects" 
                            style={{
                                maxWidth: '100%',
                                maxHeight: '70vh',
                                objectFit: 'contain',
                                border: '1px solid #ddd',
                                borderRadius: '5px'
                            }}
                        />
                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={loadSavedAdjustments}
                                style={{
                                    background: '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Load Saved Settings
                            </button>
                            <button 
                                onClick={() => setShowPreviewPopup(false)}
                                style={{
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {Object.values(croppedImages).map(
                (croppedImage) =>
                    croppedImage && <img key={croppedImage as any} src={croppedImage as any} alt="uploaded" style={{display: "none"}}></img>
            )}

            {/* Quality Tools Panel */}
            {showQualityPanel && (
                <>
                    <QualityPanel
                        showAdjustments={showAdjustments}
                        onToggleAdjustments={() => setShowAdjustments(!showAdjustments)}
                        showEffects={showEffects}
                        onToggleEffects={() => setShowEffects(!showEffects)}
                        onSharePDF={handleSharePDF}
                        darkMode={darkMode}
                        onToggleDarkMode={() => setDarkMode(!darkMode)}
                        onAddWatermark={handleAddWatermark}
                        onAddBorder={handleAddBorder}
                        onAddSignature={handleAddSignature}
                        onShowPreview={handleShowPreview}
                        onSaveAdjustments={handleSaveAdjustments}
                        enableWatermark={enableWatermark}
                        onToggleWatermark={() => setEnableWatermark(!enableWatermark)}
                        enableBorder={enableBorder}
                        onToggleBorder={() => setEnableBorder(!enableBorder)}
                        enableSignature={enableSignature}
                        onToggleSignature={() => setEnableSignature(!enableSignature)}
                    />

                    {/* Adjustments Panel Overlay */}
                    {showAdjustments && (
                        <DraggablePanel
                            title="🎛️ Image Adjustments"
                            onClose={() => setShowAdjustments(false)}
                            initialPosition={{ x: 50, y: 50 }}
                            initialSize={{ width: 350, height: 600 }}
                            borderColor="#28a745"
                        >
                            <AdjustmentsPanel
                                onAdjustmentChange={setAdjustmentValues}
                                onReset={() => setAdjustmentValues(null)}
                                showComparison={showComparison}
                                onToggleComparison={() => setShowComparison(!showComparison)}
                            />
                        </DraggablePanel>
                    )}

                    {/* Effects Panel Overlay */}
                    {showEffects && (
                        <DraggablePanel
                            title="🎨 Effect Filters"
                            onClose={() => setShowEffects(false)}
                            initialPosition={{ x: window.innerWidth - 350, y: 50 }}
                            initialSize={{ width: 300, height: 500 }}
                            borderColor="#f5576c"
                        >
                            <EffectFilters
                                onFilterSelect={setSelectedFilter}
                                selectedFilter={selectedFilter}
                            />
                        </DraggablePanel>
                    )}

                    {/* Live Preview Panel */}
                    <div style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '20px',
                        width: '280px',
                        background: 'white',
                        border: '2px solid #007bff',
                        borderRadius: '10px',
                        zIndex: 1001,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        padding: '15px'
                    }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "10px"
                        }}>
                            <h3 style={{margin: 0, fontSize: "14px", color: "#333"}}>🖼️ Live Preview</h3>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                <button 
                                    onClick={() => setShowFloatingPreview(!showFloatingPreview)}
                                    style={{
                                        background: "#007bff",
                                        color: "white",
                                        border: "none",
                                        padding: "5px 8px",
                                        borderRadius: "3px",
                                        cursor: "pointer",
                                        fontSize: "10px"
                                    }}
                                >
                                    {showFloatingPreview ? '📌' : '🔄'}
                                </button>
                                <button 
                                    onClick={generateQualityPreview}
                                    style={{
                                        background: "#4CAF50",
                                        color: "white",
                                        border: "none",
                                        padding: "5px 8px",
                                        borderRadius: "3px",
                                        cursor: "pointer",
                                        fontSize: "10px"
                                    }}
                                >
                                    🔄
                                </button>
                            </div>
                        </div>
                        <div className="preview-content">
                            {Object.keys(crops).filter(key => crops[key] && crops[key].width && crops[key].height).length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '15px', color: '#666', fontSize: '12px' }}>
                                    <p>⚠️ First crop some images</p>
                                    <p>to see preview here</p>
                                </div>
                            ) : previewImage ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ 
                                        position: 'relative', 
                                        display: 'inline-block',
                                        width: '100%',
                                        height: '120px',
                                        border: '1px solid #ddd',
                                        borderRadius: '5px',
                                        overflow: 'hidden'
                                    }}>
                                        <img 
                                            src={previewImage} 
                                            alt="Preview"
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'contain'
                                            }}
                                            draggable={false}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                                        <button 
                                            onClick={handleSaveAdjustments}
                                            style={{ 
                                                flex: 1,
                                                background: "#4CAF50",
                                                color: "white",
                                                border: "none",
                                                padding: "8px",
                                                borderRadius: "3px",
                                                cursor: "pointer",
                                                fontSize: "11px",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            💾 Apply All
                                        </button>
                                        {Object.keys(originalCroppedImages).length > 0 && (
                                            <button 
                                                onClick={handleUndoAdjustments}
                                                style={{ 
                                                    flex: 1,
                                                    background: '#f44336', 
                                                    color: 'white',
                                                    border: "none",
                                                    padding: "8px",
                                                    borderRadius: "3px",
                                                    cursor: "pointer",
                                                    fontSize: '11px',
                                                    fontWeight: "bold"
                                                }}
                                            >
                                                ↺ Undo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '15px', color: '#666', fontSize: '12px' }}>
                                    <p>🔄 Generating preview...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Main;