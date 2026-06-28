"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadAreaProps {
  onImageSelected: (file: File) => void;
  isLoading?: boolean;
}

export function UploadArea({ onImageSelected, isLoading }: UploadAreaProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setPreview(URL.createObjectURL(file));
        onImageSelected(file);
      }
    },
    [onImageSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isLoading,
  });

  const clearPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        {...getRootProps()}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all",
          isDragActive
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
            : "border-border hover:border-primary/50 hover:bg-accent/50",
          preview && "p-4",
          isLoading && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="relative inline-block">
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={preview}
              alt="Upload preview"
              className="max-h-80 rounded-xl object-contain"
            />
            {!isLoading && (
              <button
                onClick={clearPreview}
                className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform hover:scale-110"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div
              className={cn(
                "flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-inner",
                isDragActive && "from-primary/30 to-primary/20"
              )}
            >
              {isDragActive ? (
                <ImageIcon className="h-10 w-10 text-primary" />
              ) : (
                <Upload className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">
                {isDragActive
                  ? "Drop your image here"
                  : "Drag & drop an image here"}
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse &bull; PNG, JPG up to 10MB
              </p>
            </div>
          </motion.div>
        )}

        {isLoading && preview && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/60 backdrop-blur-sm">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            >
              <Loader2 className="h-10 w-10 text-primary" />
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
