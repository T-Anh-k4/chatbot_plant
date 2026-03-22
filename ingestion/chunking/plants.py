import json
import logging
from pathlib import Path
from bs4 import BeautifulSoup
from datetime import datetime

from core.settings_loader import load_settings
from ingestion.helpers.make_metadata import make_metadata
from ingestion.helpers.split_paragraphs import split_paragraphs

settings = load_settings()
logger = logging.getLogger("ingestion")

def html_to_text(html: str) -> str:  # Hàm nhận vào chuỗi HTML và trả về text thuần (không có tag)
    soup = BeautifulSoup(html, "html.parser")  # Parse chuỗi HTML bằng parser mặc định của Python
    return soup.get_text(separator=" ", strip=True)  
    # Lấy toàn bộ text trong HTML
    # separator=" " : chèn dấu cách giữa các đoạn text để tránh dính chữ
    # strip=True     : loại bỏ khoảng trắng dư ở đầu và cuối chuỗi

from collections import defaultdict

def chunk_full_diseases():
    base_path = Path(settings["data"]["processed_dir"])

    try:
        with open(base_path / "plants.json", "r", encoding="utf-8") as f:
            plants = json.load(f)

        with open(base_path / "diseases.json", "r", encoding="utf-8") as f:
            diseases = json.load(f)

        with open(base_path / "symptoms.json", "r", encoding="utf-8") as f:
            symptoms = json.load(f)

        with open(base_path / "treatments.json", "r", encoding="utf-8") as f:
            treatments = json.load(f)

    except Exception as e:
        logger.error(f"Load error: {e}")
        return []

    # ===== MAP =====
    plant_map = {p["id"]: p["plantName"] for p in plants}

    symptom_map = defaultdict(list)
    for s in symptoms:
        symptom_map[s["diseaseId"]].append(s["description"])

    treatment_map = {t["diseaseId"]: t for t in treatments}

    chunks = []

    for d in diseases:
        disease_id = d["id"]
        plant_id = d["plantId"]

        plant_name = plant_map.get(plant_id, "Không rõ")
        disease_name = d.get("diseaseName", "")
        pathogen = d.get("pathogen", "")

        # ===== xử lý triệu chứng =====
        symptom_list = symptom_map.get(disease_id, [])
        symptom = "; ".join(symptom_list) if symptom_list else "Chưa có dữ liệu"

        # ===== xử lý treatment =====
        treatment_data = treatment_map.get(disease_id, {})
        treatment = treatment_data.get("treatment", "Chưa có")
        prevention = treatment_data.get("prevention", "Chưa có")

        text = f"""
Cây: {plant_name}
Bệnh: {disease_name}
Tác nhân: {pathogen}
Triệu chứng: {symptom}
Cách điều trị: {treatment}
Phòng ngừa: {prevention}
"""

        metadata = {
            "type": "full_disease",
            "plant_id": plant_id,
            "plant_name": plant_name,
            "disease_id": disease_id,
            "disease_name": disease_name,
            "source": "merged_dataset",
            "created_at": datetime.utcnow().isoformat(),
            "language": "vi",
        }

        chunks.append({
            "text": text.strip(),
            "metadata": make_metadata(metadata, chunk_type="full_info", priority=1)
        })

    return chunks