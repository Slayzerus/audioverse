import { useEffect, useState } from "react";
import { logger } from "../utils/logger";
const log = logger.scoped('FontLoader');

interface FontLoaderProps {
    fontPath: string; // Path to directory e.g. "/src/assets/fonts/"
    formats?: string[]; // List of formats e.g. ["ttf", "woff", "otf"]
}

const FontLoader = ({ fontPath: _fontPath, formats: _formats = ["ttf"] }: FontLoaderProps) => {
    const [fonts, setFonts] = useState<string[]>([]);
    const [text, setText] = useState<string>("AudioVerse");
    const [fontSize, setFontSize] = useState<number>(32);

    useEffect(() => {
        async function loadFonts() {
            try {
                // ✅ Tworzymy poprawny glob dla Vite
                const fontImports = import.meta.glob<{ default: string }>(
                    "/src/assets/fonts/*.{ttf,woff,otf}"
                );

                const fontNames: string[] = [];

                for (const [fontFile, importFunc] of Object.entries(fontImports)) {
                    const fontModule = await importFunc();
                    const fontUrl: string = fontModule.default;

                    // ✅ Pobranie nazwy pliku czcionki bez rozszerzenia
                    const fontName = fontFile.split("/").pop()?.replace(/\.(ttf|woff|otf)$/, "") || "CustomFont";

                    fontNames.push(fontName);

                    // ✅ Tworzymy dynamiczne @font-face
                    const style = document.createElement("style");
                    style.textContent = `
                        @font-face {
                            font-family: '${fontName}';
                            src: url('${fontUrl}') format('${fontFile.split(".").pop()}');
                        }
                    `;
                    document.head.appendChild(style);
                }

                setFonts(fontNames);
            } catch (error) {
                log.error("Error loading fonts:", error);
            }
        }

        loadFonts();
    }, []);

    return (
        <div style={{ padding: "20px" }}>
            <div style={{ marginBottom: "20px" }}>
                <label>
                    Text:
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        style={{ marginLeft: "10px", padding: "5px" }}
                    />
                </label>
                <label style={{ marginLeft: "20px" }}>
                    Font Size:
                    <input
                        type="number"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value) || 1)}
                        style={{ marginLeft: "10px", padding: "5px", width: "80px" }}
                        min="1"
                    />
                </label>
            </div>

            {fonts.map((fontName, index) => (
                <div key={index} style={{ fontFamily: fontName, fontSize: `${fontSize}px`, marginBottom: "10px" }}>
                    {text} in {fontName}
                </div>
            ))}
        </div>
    );
};

export default FontLoader;
