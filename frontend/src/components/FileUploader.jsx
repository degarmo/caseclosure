"use client";

import { useRef, useState } from "react";
import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "./ui/button";

export default function FileUploader({
  value,
  onChange,
  maxSizeMB = 2,
  accept = "image/png,image/jpeg,image/jpg,image/gif",
  label = "Upload Image",
}) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(value?.preview || "");
  const [file, setFile] = useState(value?.file || null);
  const inputRef = useRef();

  const maxSize = maxSizeMB * 1024 * 1024;

  const processFile = (fileObj) => {
    if (!fileObj) return;
    if (!accept.split(",").includes(fileObj.type)) {
      setError("Unsupported file type.");
      return;
    }
    if (fileObj.size > maxSize) {
      setError(`File must be less than ${maxSizeMB}MB.`);
      return;
    }
    setError("");
    setFile(fileObj);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      onChange?.(fileObj, reader.result);
    };
    reader.readAsDataURL(fileObj);
  };

  const handleChange = (e) => {
    const fileObj = e.target.files?.[0];
    if (fileObj) processFile(fileObj);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const fileObj = e.dataTransfer.files?.[0];
    if (fileObj) processFile(fileObj);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const removeSelected = () => {
    setFile(null);
    setPreview("");
    setError("");
    onChange?.(null, "");
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`border-dashed border rounded-xl p-4 min-h-48 flex items-center justify-center flex-col relative transition-colors
          ${dragActive ? "bg-blue-50 border-blue-500" : "border-gray-300"}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={handleDragOver}
        data-dragging={dragActive || undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleChange}
          aria-label={label}
          id="file-uploader-input"
        />
        {preview ? (
          <div className="w-full flex flex-col items-center">
            <img
              src={preview}
              alt="Preview"
              className="rounded max-h-48 object-contain shadow"
            />
            <button
              type="button"
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5"
              onClick={removeSelected}
              aria-label="Remove image"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border">
              <ImageIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">Drop your image here</p>
            <p className="text-muted-foreground text-xs mb-2">
              PNG, JPG or GIF (max. {maxSizeMB}MB)
            </p>
            <Button
              variant="outline"
              className="cursor-pointer"
              type="button"
              onClick={() => inputRef.current && inputRef.current.click()}
            >
              <UploadIcon className="-ms-1 size-4 opacity-60 mr-2" />
              {label}
            </Button>
          </div>
        )}
      </div>
      {error && (
        <div className="text-red-600 flex items-center gap-1 text-xs" role="alert">
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
