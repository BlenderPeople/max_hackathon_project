import { IconButton } from '@maxhub/max-ui';
import { Download, FileImage, FileText } from 'lucide-react';
import { useState } from 'react';

import type { OrderFile } from '../api/contracts';
import { api } from '../api/client';
import { formatDate, formatFileSize } from '../lib/format';
import { SectionHeader } from './SectionHeader';

export function FileList({ files }: { files: OrderFile[] }) {
  const [downloading, setDownloading] = useState<string | null>(null);
  if (files.length === 0) return null;
  return (
    <section className="detail-section">
      <SectionHeader title="Файлы" trailing={<span className="section-count">{files.length}</span>} />
      <ul className="file-list">
        {files.map((file) => {
          const FileIcon = file.content_type.startsWith('image/') ? FileImage : FileText;
          return (
            <li key={file.id}>
              <span className="file-icon"><FileIcon size={21} /></span>
              <div><strong>{file.filename}</strong><span>{formatFileSize(file.size)} · {formatDate(file.created_at)}</span></div>
              <IconButton
                size="small"
                variant="ghost"
                loading={downloading === file.id}
                aria-label={`Скачать ${file.filename}`}
                onClick={async () => {
                  setDownloading(file.id);
                  try { await api.downloadFile(file.id); } finally { setDownloading(null); }
                }}
              ><Download size={19} /></IconButton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
