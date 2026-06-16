# model.py
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

# Save models in the same folder as this script
MODEL_PATH = os.path.dirname(__file__)  # gets current folder

# Sample dataset (replace with your real EV data)
data = pd.DataFrame({
    'battery': [0, 20, 40, 60, 80, 100],
    'temperature': [10, 15, 20, 25, 30, 35],
    'distance': [0, 24, 48, 72, 96, 120],       # km
    'charging_time': [3, 2.7, 2.3, 1.8, 1.2, 1] # hours
})

X = data[['battery', 'temperature']]
y_distance = data['distance']
y_time = data['charging_time']

# Train models
range_model = RandomForestRegressor()
range_model.fit(X, y_distance)

time_model = RandomForestRegressor()
time_model.fit(X, y_time)

# Save models
joblib.dump(range_model, os.path.join(MODEL_PATH, 'range_model.pkl'))
joblib.dump(time_model, os.path.join(MODEL_PATH, 'time_model.pkl'))

print("✅ Models trained and saved in:", MODEL_PATH)