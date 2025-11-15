export interface KaraokeLine {
    text: string;
    timestamp: number;
}

/**
 * Parsuje nuty z Ultrastar na wersy i przypisuje im timestampy.
 */
export const parseLyrics = (notes: string[]): KaraokeLine[] => {
    const lyrics: KaraokeLine[] = [];
    console.log("Starting to parseLyrics");
    let currentLine = "";
    let currentTimestamp = 0;

    notes.forEach(note => {
        //console.log("-processing note " + note);
        const parts = note.split(" ");
        //if (parts.length < 4) return;

        if (note.startsWith("-")) { console.log("#" + note + "--- ender");}
        else if (note.startsWith(":")) { console.log("#" + note + "--- line"); }
        else { console.log(note.substring(0,1)); }

        if (note.startsWith("-")) {
            //console.log("-i would like to end the line please " + note + " in " + currentLine + " / " + currentLine.trim() + " / " + currentLine.trim().length);
            if (currentLine.trim().length > 0) {
                //console.log("-koniec linii");
                lyrics.push({ text: currentLine.trim(), timestamp: currentTimestamp });
                currentLine = ""; // Resetujemy wers
            }
        } else {
            const startTime = parseFloat(parts[1]) / 10;
            if (currentLine === "") {
                currentTimestamp = startTime; // Początek wersu
            }
            currentLine += " " + parts.slice(3).join(" ");
            //console.log("-dodano do linii " + currentLine);
        }
    });

    if (currentLine.trim().length > 0) {
        lyrics.push({ text: currentLine.trim(), timestamp: currentTimestamp });
    }

    //console.log("✅ Poprawnie przetworzone wersy:", lyrics);
    return lyrics;
};


/**
 * Znajduje aktywne linie do wyświetlenia na podstawie aktualnego czasu.
 */
export const getActiveLyrics = (lyrics: KaraokeLine[], currentTime: number, maxLines = 3): string[] => {
    const activeLines: string[] = [];

    //console.log("🎯 Szukam aktywnych linii dla czasu:", currentTime);

    for (let i = 0; i < lyrics.length; i++) {
        const lineStart = lyrics[i].timestamp;
        const lineEnd = lyrics[i + 1] ? lyrics[i + 1].timestamp : lineStart + 5; // 📌 Domyślnie wers trwa 5 sekund, jeśli brak kolejnego

        console.log(`🔍 Sprawdzam wers: "${lyrics[i].text}" @ ${lineStart}s - ${lineEnd}s`);

        // 📌 Akceptujemy linie, jeśli znajdują się w przedziale czasu
        if (currentTime >= lineStart && currentTime <= lineEnd) {
            activeLines.push(lyrics[i].text);
        }

        // 📌 Jeśli linia jest starsza, ale chcemy wyświetlać historię – dodajemy ją
        if (currentTime > lineEnd && activeLines.length < maxLines) {
            activeLines.push(lyrics[i].text);
        }

        // 📌 Ograniczenie do maxLines (np. 3 linie)
        if (activeLines.length > maxLines) {
            activeLines.shift();
        }
    }

    console.log("✅ Aktywne linie:", activeLines);
    return activeLines;
};



