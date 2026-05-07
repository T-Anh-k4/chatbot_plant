import os
os.environ["TF_USE_LEGACY_KERAS"] = "0"
import tensorflow as tf
from tensorflow.keras.applications import VGG16
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Flatten

base_model = VGG16(input_shape=(224, 224, 3), include_top=False, weights=None)
model = Sequential([
    base_model,
    Flatten(),
    Dense(38, activation='softmax')
])

model.load_weights('models/Mymodel.h5')
print("Loaded VGG16 weights successfully in Keras 3!")
