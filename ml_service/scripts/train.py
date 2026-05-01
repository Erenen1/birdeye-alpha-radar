"""
train.py
========
Entrypoint for the training pipeline.
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from app.core.config import model_config
from app.data.generator import SyntheticDataGenerator
from app.model.trainer import ModelTrainer
from app.model.persistence import ModelPersistence

def main():
    print("Generating synthetic Birdeye token data...")
    generator = SyntheticDataGenerator()
    df = generator.generate()

    print("Training Random Forest Classifier...")
    trainer = ModelTrainer()
    model = trainer.fit(df)

    # Save Model
    saved_path = ModelPersistence.save(model)
    print(f"Model trained successfully! Saved to: {saved_path}")

if __name__ == "__main__":
    main()
