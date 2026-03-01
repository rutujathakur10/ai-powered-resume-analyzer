import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { extractTextFromPDF, extractTextFromDOCX } from '@/lib/resumeAnalysis';

interface ResumeUploadProps {
  onTextExtracted: (text: string, fileName: string) => void;
  extractedText: string;
  fileName: string;
}

type UploadState = 'idle' | 'extracting' | 'success' | 'error';

export function ResumeUpload({ onTextExtracted, extractedText, fileName }: ResumeUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>(extractedText ? 'success' : 'idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'docx') {
        setErrorMessage('Unsupported file type. Please upload a PDF or DOCX file.');
        setUploadState('error');
        return;
      }

      setUploadState('extracting');
      setErrorMessage('');

      try {
        let text = '';
        if (ext === 'pdf') {
          text = await extractTextFromPDF(file);
        } else {
          text = await extractTextFromDOCX(file);
        }

        if (!text.trim()) {
          throw new Error('No text could be extracted from this file. The file may be image-based or corrupted.');
        }

        onTextExtracted(text, file.name);
        setUploadState('success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to extract text from file.';
        setErrorMessage(msg);
        setUploadState('error');
      }
    },
    [onTextExtracted]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleReset = () => {
    setUploadState('idle');
    setErrorMessage('');
    onTextExtracted('', '');
  };

  return (
    <Card
      id="upload"
      className="section-anchor card-glow border-border/60 overflow-hidden"
    >
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <img
              src="/assets/generated/resume-icon.dim_128x128.png"
              alt="Resume"
              className="h-6 w-6 object-contain"
            />
          </div>
          <div>
            <CardTitle className="font-display text-lg">Resume Upload</CardTitle>
            <CardDescription>Upload your PDF or DOCX resume to begin analysis</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {uploadState !== 'success' ? (
          <label
            htmlFor="resume-file-input"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed
              p-10 cursor-pointer transition-all duration-200
              ${isDragging
                ? 'border-primary bg-primary/5 scale-[1.01]'
                : 'border-border hover:border-primary/50 hover:bg-muted/40'
              }
              ${uploadState === 'error' ? 'border-destructive/50 bg-destructive/5' : ''}
            `}
          >
            <input
              id="resume-file-input"
              type="file"
              accept=".pdf,.docx"
              className="sr-only"
              onChange={handleFileChange}
              disabled={uploadState === 'extracting'}
            />

            {uploadState === 'extracting' ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-7 w-7 text-primary animate-spin" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">Extracting text…</p>
                  <p className="text-sm text-muted-foreground mt-1">Parsing your resume content</p>
                </div>
              </>
            ) : uploadState === 'error' ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                  <AlertCircle className="h-7 w-7 text-destructive" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-destructive">Upload Failed</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">{errorMessage}</p>
                  <p className="text-xs text-muted-foreground mt-2">Click to try again</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-7 w-7 text-primary" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-foreground">
                    Drop your resume here or{' '}
                    <span className="text-primary underline underline-offset-2">browse</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Supports PDF and DOCX files</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-xs">PDF</Badge>
                  <Badge variant="secondary" className="text-xs">DOCX</Badge>
                </div>
              </>
            )}
          </label>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-success/30 bg-success/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {extractedText.split(/\s+/).filter(Boolean).length.toLocaleString()} words extracted
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Extracted Preview
                </span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-6 whitespace-pre-wrap font-mono">
                {extractedText.slice(0, 600)}{extractedText.length > 600 ? '…' : ''}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
