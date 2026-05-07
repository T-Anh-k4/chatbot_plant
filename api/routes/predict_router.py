from fastapi import APIRouter, UploadFile, File
import shutil
import os

from vision.predict import predict_disease

router = APIRouter()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/predict-disease")
async def predict(image: UploadFile = File(...)):

    file_path = os.path.join(UPLOAD_DIR, image.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    try:
        disease, confidence = predict_disease(file_path)
        return {
            "disease": disease,
            "confidence": confidence
        }
    except Exception as e:
        import traceback
        return {
            "disease": "Error: " + str(e),
            "confidence": 0.0,
            "traceback": traceback.format_exc()
        }