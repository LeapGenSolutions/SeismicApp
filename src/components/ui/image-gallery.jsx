import { useState, useRef } from "react";
import { Button } from "./button";
import { Badge } from "./badge";
import { 
  Upload, 
  X, 
  Download, 
  ZoomIn, 
  Image as ImageIcon,
  FileImage 
} from "lucide-react";

export function ImageGallery({ images, onImageAdd, onImageRemove }) {
  const [dragActive, setDragActive] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageData = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: file.type,
            size: file.size,
            data: e.target.result,
            timestamp: new Date().toISOString()
          };
          onImageAdd(imageData);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const downloadImage = (image) => {
    const link = document.createElement('a');
    link.href = image.data;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-gray-800/50' 
            : 'border-gray-700 hover:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 mx-auto text-gray-500 mb-2" />
        <p className="text-sm text-gray-400 mb-2">
          Drag & drop images here or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500">
          Supports JPG, PNG, GIF (max 5MB each)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group bg-gray-800 rounded-lg overflow-hidden"
            >
              <img
                src={image.data}
                alt={image.name}
                className="w-full h-24 object-cover"
                onClick={() => setPreviewImage(image)}
              />
              
              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                <p className="text-xs truncate text-gray-200">{image.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(image.size)}</p>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-6 h-6 p-0 bg-gray-900/80 hover:bg-gray-900 border-gray-700"
                    onClick={() => setPreviewImage(image)}
                  >
                    <ZoomIn className="w-3 h-3 text-gray-300" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-6 h-6 p-0 bg-gray-900/80 hover:bg-gray-900 border-gray-700"
                    onClick={() => downloadImage(image)}
                  >
                    <Download className="w-3 h-3 text-gray-300" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-6 h-6 p-0 bg-red-900/80 hover:bg-red-900 border-red-800"
                    onClick={() => onImageRemove(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-5 h-5" />
            </Button>
            <img
              src={previewImage.data}
              alt={previewImage.name}
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-4 left-4 bg-black/70 text-white p-2 rounded">
              <p className="text-sm text-gray-200">{previewImage.name}</p>
              <p className="text-xs text-gray-400">{formatFileSize(previewImage.size)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 