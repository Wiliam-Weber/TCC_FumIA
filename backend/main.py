import shutil
import os
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.classifier import predict_leaf
except ModuleNotFoundError:
    from classifier import predict_leaf

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "temp_uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="TabacoIA - API de Diagnostico")

# Habilita o frontend React a conversar com esta API sem bloqueio de navegador
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "API TabacoIA Online", "modo": "Upload Direto Web"}

@app.post("/diagnostico")
async def diagnosticar_folha(file: UploadFile = File(...)):
    """Recebe a foto enviada pelo site, roda a MobileNetV2 e devolve o resultado."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="O arquivo enviado deve ser uma imagem.")

    caminho_arquivo = str(UPLOAD_DIR / file.filename)

    # Salva temporariamente no disco para o classificador processar
    with open(caminho_arquivo, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        resultado = predict_leaf(caminho_arquivo)
    finally:
        # Remove a imagem temporaria apos a analise
        if os.path.exists(caminho_arquivo):
            os.remove(caminho_arquivo)

    return resultado