// AudioClipInfo.tsx
import React from "react";
import { useTranslation } from 'react-i18next';

const bytes = (n: number) => `${(n / 1024 / 1024).toFixed(2)} MB`;

const AudioClipInfo: React.FC<{ file: File; duration?: number }> = ({ file, duration }) => {
    const { t } = useTranslation();
    return (
        <div className="rounded border p-3 bg-white">
            <div className="font-medium mb-2">{t('clipInfo.fileInfo', 'File information')}</div>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-gray-600">{t('clipInfo.name', 'Name')}</dt><dd className="break-words">{file.name}</dd>
                <dt className="text-gray-600">{t('clipInfo.size', 'Size')}</dt><dd>{bytes(file.size)}</dd>
                <dt className="text-gray-600">{t('clipInfo.mimeType', 'MIME Type')}</dt><dd>{file.type || t('clipInfo.unknown', '(unknown)')}</dd>
                <dt className="text-gray-600">{t('clipInfo.duration', 'Duration')}</dt><dd>{duration != null && Number.isFinite(duration) ? `${Math.round(duration)} s` : t('clipInfo.unknown', '(unknown)')}</dd>
                <dt className="text-gray-600">{t('clipInfo.lastModified', 'Last modified')}</dt><dd>{new Date(file.lastModified).toLocaleString()}</dd>
            </dl>
        </div>
    );
};

export default React.memo(AudioClipInfo);
