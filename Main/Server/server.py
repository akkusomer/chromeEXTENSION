from fastapi import FastAPI
import uvicorn
import onnxruntime as ort
from PIL import Image
import numpy as np
import base64
import io

# ===============================
# ⚙️ AYARLAR
# ===============================
MODEL_PATH = r"akkus.onnx"
IMG_HEIGHT, IMG_WIDTH = 32, 128

# ===============================
# SABİT CHARSET
# ===============================
CHARSET = ['1', '2', '3', '4', '5', '6', '7', '8', '9',
           'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J',
           'K', 'L', 'M', 'N', 'P', 'R', 'T', 'U', 'V',
           'Y', 'Z', 'Ç', 'Ö', 'Ü', 'İ', 'Ş']

idx_to_char = {i + 1: c for i, c in enumerate(CHARSET)}

# ===============================
# MODELİ YÜKLE
# ===============================
session = ort.InferenceSession(MODEL_PATH, providers=["CPUExecutionProvider"])
print("🔥 Model yüklendi:", MODEL_PATH)

# ===============================
# CTC DECODE
# ===============================
def decode(preds):
    preds = np.argmax(preds, axis=2)
    preds = preds.squeeze().tolist()
    decoded = []
    prev = -1
    for p in preds:
        if p != prev and p != 0:
            decoded.append(idx_to_char.get(p, ""))
        prev = p
        if len(decoded) == 5:
            break
    return "".join(decoded) if decoded else "?"

# ===============================
# CAPTCHA ÇÖZ
# ===============================
def predict_captcha(image_bytes: bytes) -> str:
    img = Image.open(io.BytesIO(image_bytes)).convert("L").resize((IMG_WIDTH, IMG_HEIGHT))
    img_np = np.array(img, dtype=np.float32) / 255.0

    img_np = (img_np - 0.5) / 0.5
    img_np = img_np.reshape(1, 1, IMG_HEIGHT, IMG_WIDTH)

    output = session.run(None, {"input": img_np})[0]
    return decode(output)

# ===============================
# API
# ===============================
app = FastAPI()

@app.post("/predict")
async def predict(payload: dict):
    image_b64 = payload["image"]
    image_bytes = base64.b64decode(image_b64)

    result = predict_captcha(image_bytes)
    return {"result": result}


# ===============================
# SUNUCUYU BAŞLAT
# ===============================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
