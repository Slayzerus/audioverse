import React, { useRef, useState } from "react";
import { parseUltrastar } from "../../../scripts/api/apiKaraoke";
import { KaraokeSongFile } from "../../../models/modelsKaraoke";

interface KaraokeUploaderProps {
    onSongUpload: (song: KaraokeSongFile) => void;
}

const KaraokeUploader: React.FC<KaraokeUploaderProps> = ({ onSongUpload }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploaded, setUploaded] = useState(false);

    // 📌 Otwieranie okna wyboru pliku
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    // 📌 Obsługa przeciągania i upuszczania
    const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files.length > 0) {
            handleFileUpload(event.dataTransfer.files[0]);
        }
    };

    // 📌 Konwersja na Base64 z obsługą UTF-8
    const encodeToBase64 = (input: string): string => {
        return window.btoa(unescape(encodeURIComponent(input)));
    };

    // 📌 Konwersja pliku na Base64 i wysyłka do API
    const handleFileUpload = async (file: File) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            if (e.target?.result) {
                const textContent = e.target.result as string;
                const base64String = encodeToBase64(textContent);

                try {
                    const parsedSong = await parseUltrastar({
                        fileName: file.name,
                        data: base64String
                    });
                    onSongUpload(parsedSong);
                    setUploaded(true); // Ukryj upload i pokaż "Change Song"
                } catch (error) {
                    console.error("Błąd parsowania pliku Ultrastar:", error);
                }
            }
        };

        reader.readAsText(file, "UTF-8"); // 📌 Upewniamy się, że odczytujemy jako UTF-8
    };

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            {!uploaded ? (
                <div
                    className="karaoke-uploader"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        border: "2px dashed #ccc",
                        borderRadius: "8px",
                        cursor: "pointer"
                    }}
                    onClick={handleClick}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                >
                    <p>Click or drag & drop to upload an Ultrastar file (.txt)</p>
                    <input
                        type="file"
                        accept=".txt"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                    />
                </div>
            ) : (
                <button
                    onClick={() => {
                        setUploaded(false); // Przywrócenie uploadu
                        handleClick();
                    }}
                    style={{
                        fontSize: "16px",
                        backgroundColor: "#007bff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "10px",
                        cursor: "pointer",
                        width: "120px",
                        height: "45px"
                    }}
                >
                    🎵 Change Song
                </button>
            )}
        </div>
    );
};

export default KaraokeUploader;
