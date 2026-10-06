import numpy as np
import pandas as pd 
import tensorflow as tf 
from tensorflow.keras import layers, models
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler, LabelEncoder
import matplotlib.pyplot as plt
from tensorflow.keras.models import load_model
with tf.device('/CPU:0'):
    # Operations here run on the CPU
    tensor_cpu = tf.constant([4.0, 5.0, 6.0], shape=[1, 3])
    print(f"Tensor on device: {tensor_cpu.device}")
from tensorflow.keras.models import load_model

data = pd.read_csv("power_system_multiclass_anomaly_data.csv")
features = ['Voltage (V)','Current (A)','Power (kW)','Frequency (Hz)','Power_Factor',]
data = data[features]


scaler = MinMaxScaler()
scaled_data = scaler.fit_transform(data)

def create_sequences(data, time_steps=50):
    sequences = []
    for i in range(len(data) - time_steps):
        sequences.append(data[i:i + time_steps])
    return np.array(sequences)

TIME_STEPS = 50
X = create_sequences(scaled_data, TIME_STEPS)

X_train, X_temp = train_test_split(X, test_size=0.799, shuffle=False)
X_val, X_test = train_test_split(X_temp, test_size=0.4, shuffle=False)

print("Train:", X_train.shape)
print("Validation:", X_val.shape)
print("Test:", X_test.shape)


inputs = layers.Input(shape=(TIME_STEPS, X.shape[2]))
encoded = layers.LSTM(3504, return_sequences = True)(inputs)
encoded = layers.LSTM(1752, return_sequences = True)(encoded)
encoded = layers.LSTM(876, return_sequences = True)(encoded)
encoded = layers.LSTM(438, return_sequences = True)(encoded)
latent = layers.Dense(256, activation = "relu")(encoded)
decoded = layers.RepeatVector(TIME_STEPS)(latent)
decoded = layers.LSTM(3504, return_sequences=True)(decoded) 
decoded = layers.LSTM(1752, return_sequences=True)(decoded)
decoded = layers.LSTM(876, return_sequences=True)(decoded)
decoded = layers.LSTM(438, return_sequences=True)(decoded)
outputs = layers.TimeDistributed(layers.Dense(X.shape[2]))(decoded)

model = models.Model(inputs, outputs)
model.compile(optimizer ="adam",loss = "mse")
model.summary()


History = model.fit(X_train, X_train,
                epochs = 50,
                batch_size = 32,
                validation_data = (X_val, X_val),
                verbose = 1)


train_recon = model.predict(X_train)
train_loss = np.mean(np.abs(train_recon - X_train), axis=(1,2))

threshold = np.mean(train_loss) + 3 * np.std(train_loss)
print("Anomaly Threshold:", threshold)


test_recon = model.predict(X_test)
test_loss = np.mean(np.abs(test_recon - X_test), axis=(1,2))

anomalies = test_loss > threshold

plt.figure(figsize=(12,5))
plt.plot(test_loss, label="Reconstruction Error")
plt.axhline(threshold, color='red', linestyle='--', label="Threshold")
plt.legend()
plt.title("LSTM Autoencoder – Smart Grid Anomaly Detection")
plt.show()

print("Total Test Samples:", len(test_loss))
print("Detected Anomalies:", np.sum(anomalies))

model.save("smart_grid_anomaly_detection.h5")
load_model = load_model("./model save/smart_grid_anomaly_detection.h5")