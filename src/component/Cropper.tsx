import { useState, useEffect, useMemo } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface Props {
  cropSize: any;
  file: any;
  index: number;
  onSetCropped: any;
  onRemoveImage: any;
  crops: any;
  setCrops: any;
  keepRatio: any;
  lockMovement: any;
  centerCrop: any;
  onGlobalCropChange: any;
  disabled?: boolean; // Added disabled prop
}

const Cropper: React.FC<Props> = ({
  crops,
  setCrops,
  cropSize,
  file,
  index,
  onSetCropped,
  onRemoveImage,
  keepRatio,
  lockMovement,
  centerCrop,
  onGlobalCropChange,
  disabled = false, // Default disabled to false
}) => {
  const crop = crops[index];

  const onSetCrops = (newCropSize: any = null) => {
    if (newCropSize == null) return;
    setCrops((prev: any) => {
      const updatedCrop = {
        ...prev[index],
        ...newCropSize,
        ...(keepRatio ? { aspect: 1 } : { aspect: undefined }),
      };

      // Trigger global crop change if lock movement is enabled
      if (lockMovement && onGlobalCropChange) {
        onGlobalCropChange(index, updatedCrop);
      }

      return { ...prev, [index]: updatedCrop };
    });
  };

  useEffect(() => {
    setCrops((prev: any) => {
      return {
        ...prev,
        [index]: {
          ...prev[index],
          ...(keepRatio ? { aspect: 1 } : { aspect: undefined }),
        },
      };
    });
  }, [keepRatio]);

  const imageToCrop = useMemo(() => URL.createObjectURL(file), [file?.name]);
  const croppedImage = (value: any) => onSetCropped(index, value);

  useEffect(() => {
    // remove crop on unmount
    return () => {
      setCrops((prev: any) => {
        const newValue = { ...prev };
        if (newValue[index]) delete newValue[index];
        return newValue;
      });
    };
  }, []);

  useEffect(() => {
    if (cropSize != null) {
      onSetCrops(cropSize);
      console.log("set initial crop to", { cropSize });
    }
  }, []);

  const onSetCurrentCropSize = () => onSetCrops(cropSize);

  const onImageLoaded = (loadedImage: any) => {
    setCrops((prev: any) => {
      return {
        ...prev,
        [index]: {
          ...prev[index],
          image: loadedImage,
          name: file?.name,
          ...(cropSize ?? {}),
        },
      };
    });
  };

  const cropperInfo = crop ? `W:${crop.width} H:${crop.height}  x:${crop.x} y:${crop.y}` : "";

  return (
    <div
      style={{
        borderRadius: "0.5rem",
        overflow: "hidden",
        flexShrink: 0,
        pointerEvents: disabled ? 'none' : 'auto', // Apply pointer-events based on disabled prop
      }}
      className="cropper"
      title={file?.name}
    >
      <div className="cropper-header">
        <div className="cropper-filename">{file?.name}</div>
        {crop != null && (
          <div className="cropper-info" title={cropperInfo}>
            {cropperInfo}
          </div>
        )}
        <div className="cropper-body">
          {cropSize != null && !disabled && ( // Show only if not disabled
            <button onClick={onSetCurrentCropSize}>Set to {cropSize.width}x{cropSize.height}</button>
          )}
          {!disabled && ( // Render cross button only if not disabled
            <button className="circle-button" onClick={() => onRemoveImage(index)}>
              X
            </button>
          )}
        </div>
      </div>
      <ReactCrop
        key={file?.name}
        src={imageToCrop}
        onImageLoaded={onImageLoaded}
        crop={crop}
        onChange={(newCrop) => !lockMovement && !disabled && onSetCrops(newCrop)} // Disable onChange if disabled
        disabled={disabled} // Pass disabled prop to ReactCrop
      />
    </div>
  );
};

export default Cropper;