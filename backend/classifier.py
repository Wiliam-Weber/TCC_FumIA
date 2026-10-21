import os
from pathlib import Path
import numpy as np
from PIL import Image
import keras

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "FumIA_mobilenetv2_v2.keras"

CLASSES = [
    "Mancha marrom",               # 0  Alternaria alternata
    "Olho de rã Olho de boi",      # 1  Cercospora nicotianae
    "Antracnose",                  # 2  Colletotrichum destructivum
    "Oídio",                       # 3  Erysiphe cichoracearum
    "Folha Sadia",                 # 4  Nicotiana tabacum (sem doença)
    "Necrose das Venas",           # 5  Potato virus Y
    "Mancha-Branca Ouro-Branco",   # 6  Pseudomonas cichorii
    "Mosaico",                     # 7  Tobacco Mosaic Virus
]

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Arquivo '{MODEL_PATH.name}' não encontrado na pasta backend!")

print(f"Carregando a rede neural MobileNetV2 a partir de: {MODEL_PATH}...")
model = keras.models.load_model(MODEL_PATH)
print("MobileNetV2 pronta para inferência!")

def predict_leaf(image_path: str) -> dict:
    """Carrega a imagem, normaliza e executa a classificação."""
    img = Image.open(image_path).convert("RGB").resize((224, 224))
    
    # Conversão para array e normalização [-1, 1] da MobileNetV2
    img_array = keras.utils.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = keras.applications.mobilenet_v2.preprocess_input(img_array)

    predictions = model.predict(img_array)
    class_idx = int(np.argmax(predictions[0]))
    confidence = float(predictions[0][class_idx]) * 100

    label = CLASSES[class_idx] if class_idx < len(CLASSES) else f"Classe_{class_idx}"

    return {
        "diagnostico": label,
        "confianca": round(confidence, 2),
        "indice_classe": class_idx
    }