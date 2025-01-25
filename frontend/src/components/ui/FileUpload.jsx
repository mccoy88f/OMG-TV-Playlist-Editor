// FileUpload.jsx
import React, { useRef } from 'react';
import { Upload } from 'lucide-react';
import { Button } from './Button';

export function FileUpload({ onUpload, accept = ".m3u,.m3u8" }) {
  const inputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      onUpload(content, file.name);
    } catch (error) {
      console.error('Error reading file:', error);
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button 
        variant="outline"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload File
      </Button>
    </div>
  );
}