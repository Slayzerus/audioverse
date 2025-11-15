import * as ffmpegModule from '@ffmpeg/ffmpeg';

const ffmpeg = (ffmpegModule as any).createFFmpeg;
const fetchFile = (ffmpegModule as any).fetchFile;

export async function mergeAudio(files: File[], outputFormat: "mp3" | "wav" | "flac" = "wav"): Promise<Blob> {
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    for (let i = 0; i < files.length; i++) {
        ffmpeg.FS('writeFile', `input${i}.wav`, await fetchFile(files[i]));
    }

    await ffmpeg.run('-i', 'concat:input0.wav|input1.wav', '-acodec', 'copy', `output.${outputFormat}`);

    const data = ffmpeg.FS('readFile', `output.${outputFormat}`);
    return new Blob([data.buffer], { type: `audio/${outputFormat}` });
}

export async function splitAudio(file: File, startTime: number, duration: number, outputFormat: "mp3" | "wav" | "flac" = "wav"): Promise<Blob> {
    if (!ffmpeg.isLoaded()) await ffmpeg.load();

    ffmpeg.FS('writeFile', 'input.wav', await fetchFile(file));
    await ffmpeg.run('-i', 'input.wav', '-ss', `${startTime}`, '-t', `${duration}`, `output.${outputFormat}`);

    const data = ffmpeg.FS('readFile', `output.${outputFormat}`);
    return new Blob([data.buffer], { type: `audio/${outputFormat}` });
}
