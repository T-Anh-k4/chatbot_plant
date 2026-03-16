import numpy as np
import cv2

from .model_loader import get_model
from .labels import CLASS_NAMES

IMG_SIZE = 150


def format_disease_name(name):

    plant, disease = name.split("___")
    disease = disease.replace("_", " ")

    return f"{plant} - {disease}"


def predict_disease(image_path):

    model = get_model()

    img = cv2.imread(image_path)
    img = cv2.resize(img, (150,150))
    img = img / 255.0

    img = np.expand_dims(img, axis=0)

    prediction = model.predict(img)

    class_id = np.argmax(prediction)
    confidence = float(prediction[0][class_id])

    disease = CLASS_NAMES[class_id]
    disease = format_disease_name(disease)

    return disease, confidence