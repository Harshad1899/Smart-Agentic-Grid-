from pathlib import Path
from typing import List

import joblib
import numpy as np
import tensorflow as tf
from pydantic import BaseModel

THRESHOLD = 0.30
TIME_STEP = 50
MODEL_FILENAME = "smart_grid_anomaly_detection.h5"


class sequenceInput(BaseModel):
    sequence: List[list[float]]


def _resolve_model_path() -> Path:
    backend_model = Path(__file__).resolve().parent / MODEL_FILENAME
    training_model = Path(__file__).resolve().parents[1] / "trainning model" / MODEL_FILENAME

    if backend_model.exists():
        return backend_model
    if training_model.exists():
        return training_model

    raise FileNotFoundError(
        f"Model file not found. Checked '{backend_model}' and '{training_model}'."
    )


def load_model():
    model = tf.keras.models.load_model(_resolve_model_path(), compile=False)
    return model


def predict_anomaly(model, sequence):
    data = np.array(sequence)

    if data.shape[0] != TIME_STEP:
        raise ValueError(f"Sequence length must be {TIME_STEP} time step ")

    features = data.shape[1] if len(data.shape) > 1 else 1
    x = data.reshape(1, TIME_STEP, features)

    reconstruction = model.predict(x, verbose=0)

    error = np.mean(np.abs(reconstruction - x))

    status = "anomaly" if error > THRESHOLD else "normal"

    return {
        "status": status,
        "error": float(error),
        "threshold": THRESHOLD,
    }


def generate_response(status, error):
    if status == "anomaly":
        return {
            "status": "anomaly",
            "message": "Anomaly detected in the sequence",
            "error": float(error),
            "threshold": THRESHOLD,
        }
    else:
        return {
            "status": "normal",
            "message": "Normal sequence detected",
            "error": float(error),
            "threshold": THRESHOLD,
        }
