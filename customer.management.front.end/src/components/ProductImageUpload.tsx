import { useRef } from "react";
import "../assets/components-styles/ProductImageUpload.css";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface ProductImageUploadProps {
  previewUrl: string | null;
  disabled?: boolean;
  onFileSelect: (file: File, previewUrl: string) => void;
  onClear: () => void;
}

export function ProductImageUpload({
  previewUrl,
  disabled = false,
  onFileSelect,
  onClear,
}: ProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      alert("Only JPG, PNG, and WebP images are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert("Image must be 2 MB or smaller.");
      return;
    }

    onFileSelect(file, URL.createObjectURL(file));
  };

  return (
    <div className="product-image-upload">
      <label className="product-image-upload-label">Product Image</label>
      <div
        className={`product-image-dropzone ${previewUrl ? "has-image" : ""}`}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (!disabled && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload product image"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Product preview" className="product-image-preview" />
        ) : (
          <div className="product-image-placeholder">
            <span className="product-image-placeholder-icon">📷</span>
            <span>Click to upload</span>
            <span className="product-image-placeholder-hint">JPG, PNG, WebP · max 2 MB</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="product-image-input"
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div className="product-image-actions">
        <button
          type="button"
          className="product-image-btn"
          onClick={() => !disabled && inputRef.current?.click()}
          disabled={disabled}
        >
          {previewUrl ? "Change" : "Upload"}
        </button>
        {previewUrl && (
          <button
            type="button"
            className="product-image-btn product-image-btn-remove"
            onClick={onClear}
            disabled={disabled}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
