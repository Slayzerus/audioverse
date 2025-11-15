export class AudioRecorder {
    private streams: MediaStream[] = [];
    private mediaRecorders: MediaRecorder[] = [];
    private audioChunks: Map<string, Blob[]> = new Map();
    private isRecording = false;

    async startRecording() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === "audioinput");

        for (const device of audioDevices) {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { deviceId: device.deviceId },
            });
            this.streams.push(stream);

            const mediaRecorder = new MediaRecorder(stream);
            this.mediaRecorders.push(mediaRecorder);
            this.audioChunks.set(device.deviceId, []);

            mediaRecorder.ondataavailable = event => {
                this.audioChunks.get(device.deviceId)?.push(event.data);
            };

            mediaRecorder.start();
        }

        this.isRecording = true;
    }

    stopRecording(): Promise<{ [key: string]: Blob }> {
        return new Promise((resolve) => {
            if (!this.isRecording) return resolve({});

            const recordings: { [key: string]: Blob } = {};

            this.mediaRecorders.forEach((recorder, index) => {
                recorder.stop();
                recorder.onstop = () => {
                    const deviceId = this.streams[index].getAudioTracks()[0].getSettings().deviceId || `mic-${index}`;
                    const audioBlob = new Blob(this.audioChunks.get(deviceId) || [], { type: "audio/wav" });
                    recordings[deviceId] = audioBlob;
                };
            });

            this.isRecording = false;
            setTimeout(() => resolve(recordings), 500); // Dajemy czas na zapisanie
        });
    }

    downloadRecording(blob: Blob, filename: string) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}
