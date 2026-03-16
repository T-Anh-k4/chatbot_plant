import json
import logging
from pathlib import Path
from datetime import datetime

from core.settings_loader import load_settings
from ingestion.helpers.make_metadata import make_metadata

settings = load_settings()
logger = logging.getLogger("ingestion")


def chunk_diseases():
    file_path = Path(settings["data"]["processed_dir"]) / "news.json"

    if not file_path.exists():
        logger.error(f"File not found: {file_path}")
        return []

    try:
        with open(file_path, "r", encoding="utf-8") as file:
            diseases = json.load(file)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON format {e}")
        return []
    except Exception as e:
        logger.error(f"Failed to load {e}")
        return []

    if isinstance(diseases, dict):
        diseases = [diseases]

    if not isinstance(diseases, list):
        logger.error("Disease data is not a list")
        return []

    chunks = []

    for idx, disease in enumerate(diseases):

        plant = disease.get("plantName", "")
        disease_name = disease.get("diseaseName", "")
        pathogen = disease.get("pathogen", "")
        symptoms = disease.get("symptoms", "")
        causes = disease.get("causes", "")
        treatment = disease.get("treatment", "")
        prevention = disease.get("prevention", "")

        base_metadata = {
            "type": "plant_disease",
            "plant": plant,
            "disease": disease_name,
            "source": "news.json",
            "created_at": datetime.utcnow().isoformat(),
            "language": "vi"
        }

        # Chunk overview
        chunks.append({
            "text": f"""
Cây: {plant}
Bệnh: {disease_name}
Tác nhân: {pathogen}

Triệu chứng: {symptoms}
Nguyên nhân: {causes}
""",
            "metadata": make_metadata(base_metadata, chunk_type="overview", priority=1)
        })

        # Chunk treatment
        chunks.append({
            "text": f"""
Hướng dẫn xử lý bệnh {disease_name} trên cây {plant}:

Cách điều trị:
{treatment}

Biện pháp phòng ngừa:
{prevention}
""",
            "metadata": make_metadata(base_metadata, chunk_type="treatment", priority=2)
        })

    return chunks