FROM python:3.12-slim

WORKDIR /app

# Sistem bağımlılıkları (gerekirse model için)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Gereksinimleri kopyala ve yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Tüm ML servis kodlarını kopyala
COPY . .

# Konteyner ayağa kalkarken modeli eğit (Eğer model dosyası yoksa garantiye almak için)
RUN python scripts/train.py

EXPOSE 8000

# API'yi başlat
CMD ["python", "-m", "app.main"]
