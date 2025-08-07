
import {useEffect, useRef, useState} from "react";
import "../App.css";
import Cropper from "../component/Cropper";
import Select from "../component/Select";
import About from "../component/About";

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
        const tab = tabs.find(t => t.id === activeTabId);
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
        console.log("set new files", { input, files, newFiles: imageFiles });
        setFiles(prev => imageFiles.length > 0 ? ([...prev, ...imageFiles]) : imageFiles);
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

    const generateCroppedImage = (crop: any, index: number) => {
        const resizeImageToCrop = resizeOnExport && cropSize != null && cropSize.width === cropSize.height ? cropSize : crop;
        const image = crop?.image;
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
                const link = document.createElement('a');
                link.download = croppedImage.filename;
                link.href = croppedImage.dataUrl;
                link.click();
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
                                    <div title={files.length + " files"}>{files.length} files</div>
                                    <button onClick={onSelectSomeFiles} className="button">Add Files</button>
                                    <button onClick={onSelectFolder} className="button">📁 Add Folder</button>
                                    {selectedFiles.size > 0 && (
                                        <>
                                            <div style={{color: "#4CAF50"}}>✓ {selectedFiles.size} selected</div>
                                            <button onClick={selectAllFiles} className="button">Select All</button>
                                            <button onClick={clearSelection} className="button">Clear</button>
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
                                webkitdirectory=""
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
                                <div style={{display: "flex", gap: 4, alignItems: "center"}}>
                                    <button onClick={onSetAllToCrop}>Set all to</button>
                                    <Select selectItems={cropSizePresets} selectId="crop-presets" onSelect={setCropSize}/>
                                    <div onClick={()=> setKeepRatio((prev:boolean) => !prev)} className="checkbox">
                                        <input type="checkbox" checked={keepRatio}/>
                                        <div className="box-bg">Keep ratio</div>
                                    </div>
                                    <div onClick={()=> setLockMovement((prev:boolean) => !prev)} className="checkbox" title="Sync crop changes across all images">
                                        <input type="checkbox" checked={lockMovement}/>
                                        <div className="box-bg">🔒 Lock Movement</div>
                                    </div>
                                    <div onClick={()=> setCenterCrop((prev:boolean) => !prev)} className="checkbox" title="Center crop on all images">
                                        <input type="checkbox" checked={centerCrop}/>
                                        <div className="box-bg">🎯 Center Crop</div>
                                    </div>
                                    <div onClick={()=> setEnableOCR((prev:boolean) => !prev)} className="checkbox" title="Enable OCR for PDF searchable text">
                                        <input type="checkbox" checked={enableOCR}/>
                                        <div className="box-bg">🔍 Enable OCR</div>
                                    </div>
                                    <div onClick={()=> setGridView((prev:boolean) => !prev)} className="checkbox" title="Toggle between grid and single view">
                                        <input type="checkbox" checked={gridView}/>
                                        <div className="box-bg">📱 Grid View</div>
                                    </div>
                                </div>
                                <div style={{display: "flex", gap: 4, alignItems: "center"}}>
                                    {cropSize && keepRatio && (
                                        <div onClick={()=> setResizeOnExport((prev:boolean) => !prev)} className="checkbox" title="This will resize the exported images when on">
                                            <input type="checkbox" checked={resizeOnExport}/>
                                            <div className="box-bg">Resize to {cropSize.width}x{cropSize.height}</div>
                                        </div>
                                    )}
                                    <button onClick={onSaveCropped} className="export-button">
                                        📷 Export {selectedFiles.size > 0 ? `Selected (${selectedFiles.size})` : 'All'}
                                    </button>
                                    <button onClick={onSaveAsZip} className="export-button">
                                        📦 ZIP {selectedFiles.size > 0 ? `Selected (${selectedFiles.size})` : 'All'}
                                    </button>
                                    <button onClick={onGeneratePDF} className="export-button">
                                        📄 PDF {selectedFiles.size > 0 ? `Selected (${selectedFiles.size})` : 'All'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <>
                        

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
                                             border: isSelected ? "3px solid #4CAF50" : "none",
                                             borderRadius: "0.5rem"
                                         }}
                                         onMouseDown={() => handleMouseDown(actualIndex)}
                                         onMouseUp={handleMouseUp}
                                         onMouseLeave={handleMouseUp}
                                    >
                                        {isSelected && (
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
                                        />
                                    </div>
                                );
                            })
                            }
                        </div>

                        {Object.values(croppedImages).map(
                            (croppedImage) =>
                                croppedImage && <img src={croppedImage as any} alt="uploaded"></img>
                        )}
                    </>
                </>
            )}
        </div>
    );
}

export default Main;
