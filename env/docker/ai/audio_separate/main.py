from fastapi import FastAPI, UploadFile, File, Response
import demucs.separate, tempfile, os, shutil, io, zipfile, torch
import soundfile as sf, numpy as np

app = FastAPI()

@app.post("/separate")
async def separate(file: UploadFile = File(...), stems: int = 2):
    raw = await file.read()
    # zapisz tymczasowo plik (Demucs chce ścieżkę)
    with tempfile.TemporaryDirectory() as tmp:
        inp = os.path.join(tmp, "input.wav")
        data, sr = sf.read(io.BytesIO(raw), dtype='float32')
        if data.ndim == 1:
            data = np.stack([data, data], axis=1)
        sf.write(inp, data, sr)

        outdir = os.path.join(tmp, "out")
        model = "htdemucs" if stems == 4 else "mdx_extra_q"  # 2 stems: vocals+other
        demucs.separate.main([
            "-n", model,
            "-o", outdir,
            inp
        ])

        # spakuj do ZIP
        memory_file = io.BytesIO()
        with zipfile.ZipFile(memory_file, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(outdir):
                for f in files:
                    path = os.path.join(root, f)
                    zf.write(path, arcname=os.path.relpath(path, outdir))
        memory_file.seek(0)
        return Response(memory_file.read(),
                        media_type="application/zip",
                        headers={"Content-Disposition": 'attachment; filename="stems.zip"'})
