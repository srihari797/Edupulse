import os
from dotenv import load_dotenv
from sqlalchemy import create_engine

# Load the .env file
load_dotenv()

# Read the DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    raise ValueError("DATABASE_URL not found in .env")

# Create the engine
engine = create_engine(DATABASE_URL)

# Test the connection
with engine.connect() as connection:
    print("Connected Successfully!")