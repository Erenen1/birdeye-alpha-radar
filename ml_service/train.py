"""
train.py
========
Entrypoint for the training pipeline.
"""
from core.config import model_config
from data.generator import SyntheticDataGenerator
from model.trainer import ModelTrainer
from model.persistence import ModelPersistence

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
