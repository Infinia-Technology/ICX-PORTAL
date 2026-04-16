import { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileUpload({
  label,
  value = [],
  onChange,
  maxFiles = 5,
  error,
  required = false,
  className = '',
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `${file.name}: File type not allowed`;
    }
    if (file.size > MAX_SIZE) {
      return `${file.name}: File too large (max 10MB)`;
    }
    return null;
  };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList);
    const errors = newFiles.map(validateFile).filter(Boolean);
    if (errors.length) {
      alert(errors.join('\n'));
      return;
    }
    if (value.length + newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }
    onChange([...value, ...newFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[var(--color-text)]">
          {label}
          {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
        </label>
      )}
      <div
        className={`
          border-2 border-dashed rounded-[var(--radius-md)] p-6 text-center
          cursor-pointer transition-colors
          ${dragActive ? 'border-[var(--color-primary)] bg-blue-50' : 'border-[var(--color-border)] hover:border-gray-400'}
        `}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <Upload className="w-8 h-8 mx-auto text-[var(--color-text-muted)] mb-2" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Drag & drop or click to upload
        </p>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          PDF, DOC, DOCX, JPG, PNG (max 10MB)
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {value.length > 0 && (
        <div className="flex flex-col gap-2 mt-2">
          {value.map((file, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-[var(--radius-md)]">
              <FileText className="w-4 h-4 text-[var(--color-text-muted)]" />
              <span className="text-sm flex-1 truncate">{file.name || file.fileName}</span>
              <button onClick={() => removeFile(i)} className="text-[var(--color-text-muted)] hover:text-[var(--color-error)]">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
    </div>
  );
}
