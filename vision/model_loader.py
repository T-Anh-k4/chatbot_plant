# 
import tensorflow as tf
from pathlib import Path
from tensorflow.keras.applications import VGG16
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Flatten

MODEL_PATH = Path("models/Mymodel.h5")

model = None

def get_model():
    global model
    if model is None:
        base_model = VGG16(input_shape=(224, 224, 3), include_top=False, weights=None)
        model = Sequential([base_model, Flatten(), Dense(38, activation='softmax')])
        model.build(input_shape=(None, 224, 224, 3))
        model.load_weights(str(MODEL_PATH))
    return model