import tensorflow as tf
from pathlib import Path

MODEL_PATH = Path("models/my_cnn_model.h5")

model = None

def get_model():
    global model
    if model is None:
        model = tf.keras.models.load_model(MODEL_PATH)
    return model