export interface KaraokeNoteData {
    startTime: number;
    duration: number;
    pitch: number;
}

/**
 * Konwertuje linijki nut Ultrastar na obiekty `KaraokeNoteData`
 */
export const parseNotes = (notes: string[]): KaraokeNoteData[][] => {
    const noteLines: KaraokeNoteData[][] = [];
    let currentLine: KaraokeNoteData[] = [];

    notes.forEach(note => {
        const parts = note.split(" ");
        if (parts.length < 4) return;

        if (note.startsWith("-")) {
            if (currentLine.length > 0) {
                noteLines.push(currentLine);
                currentLine = [];
            }
        } else {
            currentLine.push({
                startTime: parseFloat(parts[1]) / 10,
                duration: parseFloat(parts[2]) / 10,
                pitch: parseInt(parts[3], 10),
            });
        }
    });

    if (currentLine.length > 0) noteLines.push(currentLine);
    return noteLines;
};

/**
 * Rysuje poziome linie pomocnicze dla orientacji wysokości dźwięków
 */
const drawGuideLines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 12; i++) {
        const y = height - i * 15;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
};

/**
 * Rysuje pojedynczą linię wersów (nuty + połączenia)
 */
const drawNoteline = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    noteLine: KaraokeNoteData[],
    timelineStart: number,
    timelineEnd: number
) => {
    let previousNote: KaraokeNoteData | null = null;

    noteLine.forEach(note => {
        if (note.startTime + note.duration < timelineStart || note.startTime > timelineEnd) return;

        const x = ((note.startTime - timelineStart) / (timelineEnd - timelineStart)) * width;
        const noteWidth = (note.duration / (timelineEnd - timelineStart)) * width;
        const y = height - note.pitch * 4;

        // 📌 Rysowanie linii pomocniczych
        ctx.fillStyle = "#00aaff";
        ctx.fillRect(x, y, noteWidth, 10);

        // 📌 Połączenia między nutami
        if (previousNote) {
            const prevX = ((previousNote.startTime - timelineStart) / (timelineEnd - timelineStart)) * width;
            const prevY = height - previousNote.pitch * 4;
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(x, y);
            ctx.stroke();
        }
        previousNote = note;
    });
};

/**
 * Rysuje całą linię nut, złotą kulkę oraz UI
 */
export const drawTimeline = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    noteLines: KaraokeNoteData[][],
    currentTime: number,
    playerName: string,
    score: number,
    playerBgColor: string
) => {
    ctx.clearRect(0, 0, width, height);

    const timelineStart = currentTime - 2;
    const timelineEnd = currentTime + 5;

    drawGuideLines(ctx, width, height); // 📌 Rysowanie poziomych linii odniesienia

    let ballX = width * 0.1;
    let ballY = height * 0.5;
    let foundActiveNote = false;

    noteLines.forEach(line => {
        drawNoteline(ctx, width, height, line, timelineStart, timelineEnd);

        for (const note of line) {
            if (currentTime >= note.startTime && currentTime <= note.startTime + note.duration) {
                const noteStartX = ((note.startTime - timelineStart) / (timelineEnd - timelineStart)) * width;
                const noteEndX = ((note.startTime + note.duration - timelineStart) / (timelineEnd - timelineStart)) * width;
                ballX = noteStartX + ((currentTime - note.startTime) / note.duration) * (noteEndX - noteStartX);
                ballY = height - note.pitch * 4;
                foundActiveNote = true;
            }
        }
    });

    // 📌 Jeśli nie ma aktywnej nuty, znajdź najbliższą w wersie
    if (!foundActiveNote) {
        for (const line of noteLines) {
            for (const note of line) {
                if (note.startTime > currentTime) {
                    ballX = ((note.startTime - timelineStart) / (timelineEnd - timelineStart)) * width;
                    ballY = height - note.pitch * 4;
                    foundActiveNote = true;
                    break;
                }
            }
            if (foundActiveNote) break;
        }
    }

    // 📌 Rysowanie złotej kulki – teraz porusza się płynnie!
    ctx.fillStyle = "#ffcc00";
    ctx.beginPath();
    ctx.arc(ballX, ballY + 5, 6, 0, Math.PI * 2);
    ctx.fill();

    // 📌 UI – Imię gracza
    ctx.fillStyle = playerBgColor;
    ctx.fillRect(10, 10, 120, 30);
    ctx.fillStyle = "#fff";
    ctx.font = "16px Arial";
    ctx.fillText(playerName, 20, 30);

    // 📌 UI – Punkty gracza
    const scoreWidth = 120;
    ctx.fillStyle = playerBgColor;
    ctx.fillRect(width - scoreWidth - 10, 10, scoreWidth, 30);
    ctx.fillStyle = "#fff";
    ctx.fillText(`${score} pts`, width - scoreWidth + 20, 30);
};
