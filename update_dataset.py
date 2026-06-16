import pandas as pd
import numpy as np

# Load your original dataset
df = pd.read_csv("electric_vehicles.csv")

# Remove missing values
df = df.dropna()

# 🔥 Add new smart columns

# Simulated vehicles at station
df['Vehicles'] = np.random.randint(5, 50, size=len(df))

# Charging slots (fixed capacity type)
df['Slots'] = np.random.randint(10, 30, size=len(df))

# Charging time (based on battery range)
df['ChargingTime'] = np.random.randint(30, 60, size=len(df))

# Temperature (simulate weather)
df['Temperature'] = np.random.randint(25, 40, size=len(df))

# Time of day
df['Time'] = np.random.randint(0, 24, size=len(df))

# Battery % (simulate)
df['Battery'] = np.random.randint(40, 100, size=len(df))

# Speed
df['Speed'] = np.random.randint(30, 100, size=len(df))

# 🔥 Derived outputs

df['WaitingTime'] = (df['Vehicles'] / df['Slots']) * df['ChargingTime']
df['Availability'] = df['Slots'] - df['Vehicles']
df['Load'] = df['Vehicles'] * 5
df['BatteryHealth'] = df['Battery'] - (df['Temperature'] * 0.2)

# Save updated dataset
df.to_csv("electric_vehicles_updated.csv", index=False)

print("✅ Dataset updated successfully!")