from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
import random

try:
    from .model_logic import sequenceInput as SequenceInput, load_model, predict_anomaly
except ImportError:
    from model_logic import sequenceInput as SequenceInput, load_model, predict_anomaly

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__) 

app = FastAPI(
    title = "Smart Grid Anomaly Detection API",
    description = "API for detecting anomalies in smart grid data",
    version = "1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

model = None
mock_results = []
step_counter = 0
MAX_BATCHES = 7
STEPS_PER_BATCH = 60
MAX_STEPS = MAX_BATCHES * STEPS_PER_BATCH
MOCK_THRESHOLD = 0.30

def get_model():
    global model
    if model is None:
        logger.info("Loading anomaly detection model")
        model = load_model()
    return model


@app.get("/")
async def root():
    return {"message": "Welcome to the Smart Grid Anomaly Detection API"}


@app.get("/api/results")
async def get_results():
    """Mock endpoint that streams 420 step-level records (7 batches x 60 steps)."""
    global step_counter
    if step_counter < MAX_STEPS:
        step_counter += 1

        batch_number = ((step_counter - 1) // STEPS_PER_BATCH) + 1
        step_in_batch = ((step_counter - 1) % STEPS_PER_BATCH) + 1
        batch_progress = step_in_batch / STEPS_PER_BATCH

        
        accuracy = min(0.99, 0.58 + (batch_number * 0.04) + (batch_progress * 0.08) + random.uniform(-0.015, 0.015))
        loss = max(0.01, 0.52 - (batch_number * 0.035) - (batch_progress * 0.07) + random.uniform(-0.02, 0.02))
        process_time = random.uniform(0.8, 1.5)
        status = "anomaly" if loss > MOCK_THRESHOLD else "normal"

        mock_results.append({
            "batch": batch_number,
            "step": step_counter,
            "step_in_batch": step_in_batch,
            "accuracy": round(accuracy, 4),
            "loss": round(loss, 4),
            "error": round(loss, 4),
            "threshold": MOCK_THRESHOLD,
            "status": status,
            "time": round(process_time, 2)
        })

    return mock_results[:MAX_STEPS]


@app.post("/api/results/reset")
async def reset_results():
    """Reset the mock stream so the dashboard can replay all 7 batches."""
    global step_counter, mock_results
    step_counter = 0
    mock_results = []
    return {"message": "Results reset", "total_batches": MAX_BATCHES, "steps_per_batch": STEPS_PER_BATCH}

@app.post("/predict")
async def predict(sequence: SequenceInput):
    try:
        result = predict_anomaly(get_model(), sequence.sequence)
        logger.info(f"Prediction result: {result}")
        return result

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
