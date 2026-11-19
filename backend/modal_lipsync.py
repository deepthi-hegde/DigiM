"""
Modal.com Serverless Lip-Sync Worker (SadTalker on T4 GPU)
----------------------------------------------------------
Scale-to-zero talking-head video generator for DigiM.
- Free tier: $30/month free credits on Modal.com (~10,000+ videos/month)
- Cost after free tier: ~$0.003 per video (T4 GPU billed per second, $0 when idle)
- Audio-driven: Output MP4 matches the exact full length of the input voiceover.

Setup (3 commands after creating a free account at https://modal.com):
  1. pip install modal
  2. modal setup
  3. modal deploy backend/modal_lipsync.py

Copy the printed endpoint URL into backend/.env as:
  MODAL_LIPSYNC_URL=https://<your-workspace>--digim-lipsync-generate-lipsync.modal.run
"""

import modal

app = modal.App("digim-lipsync")

# Persistent volume to cache SadTalker model checkpoints across cold starts
weights_vol = modal.Volume.from_name("digim-sadtalker-weights", create_if_missing=True)

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("git", "ffmpeg", "libgl1", "libglib2.0-0", "wget")
    .pip_install(
        "torch==2.1.2",
        "torchvision==0.16.2",
        "torchaudio==2.1.2",
        "numpy<2.0",
        "scipy",
        "pillow",
        "imageio",
        "imageio-ffmpeg",
        "face-alignment==1.3.5",
        "yacs",
        "pyyaml",
        "tqdm",
        "joblib",
        "scikit-image",
        "basicsr",
        "facexlib",
        "gfpgan",
        "pydub",
        "kornia",
        "safetensors",
        "fastapi[standard]",
    )
    .run_commands(
        "git clone https://github.com/OpenTalker/SadTalker.git /opt/SadTalker",
    )
)


@app.function(
    image=image,
    gpu="T4",
    timeout=300,
    volumes={"/opt/SadTalker/checkpoints": weights_vol},
)
@modal.fastapi_endpoint(method="POST")
def generate_lipsync(payload: dict):
    """
    POST JSON:
      {
        "image_base64": "<base64 jpg/png>",
        "audio_base64": "<base64 mp3/wav>"
      }
    Returns JSON:
      {
        "status": "success",
        "video_base64": "<base64 mp4>"
      }
    """
    import base64
    import glob
    import os
    import subprocess
    import tempfile
    import urllib.request

    image_b64 = payload.get("image_base64", "")
    audio_b64 = payload.get("audio_base64", "")
    if not image_b64 or not audio_b64:
        return {"status": "error", "detail": "image_base64 and audio_base64 are required"}

    ckpt_dir = "/opt/SadTalker/checkpoints"
    os.makedirs(ckpt_dir, exist_ok=True)

    # Download essential SadTalker checkpoints once into persistent Modal Volume
    required_files = {
        "SadTalker_V0.0.2_256.safetensors": "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/SadTalker_V0.0.2_256.safetensors",
        "mapping_00109-model.pth.tar": "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00109-model.pth.tar",
        "mapping_00229-model.pth.tar": "https://github.com/OpenTalker/SadTalker/releases/download/v0.0.2-rc/mapping_00229-model.pth.tar",
    }
    downloaded_any = False
    for fname, url in required_files.items():
        fpath = os.path.join(ckpt_dir, fname)
        if not os.path.exists(fpath):
            urllib.request.urlretrieve(url, fpath)
            downloaded_any = True
    if downloaded_any:
        weights_vol.commit()

    with tempfile.TemporaryDirectory() as tmpdir:
        img_path = os.path.join(tmpdir, "presenter.jpg")
        mp3_path = os.path.join(tmpdir, "voice.mp3")
        wav_path = os.path.join(tmpdir, "voice.wav")
        out_dir = os.path.join(tmpdir, "out")
        os.makedirs(out_dir, exist_ok=True)

        with open(img_path, "wb") as f:
            f.write(base64.b64decode(image_b64))
        with open(mp3_path, "wb") as f:
            f.write(base64.b64decode(audio_b64))

        # Convert MP3 to 16kHz mono WAV for SadTalker
        subprocess.run(
            ["ffmpeg", "-y", "-i", mp3_path, "-ar", "16000", "-ac", "1", wav_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        # Run SadTalker inference (audio-driven: matches full audio length)
        cmd = [
            "python3",
            "/opt/SadTalker/inference.py",
            "--driven_audio", wav_path,
            "--source_image", img_path,
            "--result_dir", out_dir,
            "--checkpoint_dir", ckpt_dir,
            "--preprocess", "full",
            "--size", "256",
            "--expression_scale", "1.1",
        ]
        subprocess.run(cmd, cwd="/opt/SadTalker", check=True)

        mp4_files = glob.glob(os.path.join(out_dir, "**", "*.mp4"), recursive=True)
        if not mp4_files:
            return {"status": "error", "detail": "SadTalker did not produce an MP4 file"}

        with open(mp4_files[0], "rb") as vf:
            video_b64 = base64.b64encode(vf.read()).decode("utf-8")

        return {"status": "success", "video_base64": video_b64}
