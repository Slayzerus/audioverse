// AudioClipInfo.tsx
import React from "react";

const bytes = (n: number) => `${(n / 1024 / 1024).toFixed(2)} MB`;

const AudioClipInfo: React.FC<{ file: File; duration?: number }> = ({ file, duration }) => {
    return (
        <div className="rounded border p-3 bg-white">
            <div className="font-medium mb-2">Informacje o pliku</div>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-gray-600">Nazwa</dt><dd className="break-words">{file.name}</dd>
                <dt className="text-gray-600">Rozmiar</dt><dd>{bytes(file.size)}</dd>
                <dt className="text-gray-600">Typ MIME</dt><dd>{file.type || "(brak/nieznany)"}</dd>
                <dt className="text-gray-600">Czas trwania</dt><dd>{duration != null && Number.isFinite(duration) ? `${Math.round(duration)} s` : "(nieznany)"}</dd>
                <dt className="text-gray-600">Ostatnia modyfikacja</dt><dd>{new Date(file.lastModified).toLocaleString()}</dd>
            </dl>
        </div>
    );
};

export default AudioClipInfo;
