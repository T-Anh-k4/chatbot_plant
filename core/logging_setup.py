# import logging.config
# import yaml

# def setup_logging():
#     with open("config/logging.yaml") as file:
#         logging.config.dictConfig(yaml.safe_load(file)) # doc file yaml va chuyen sang python dict
import logging.config
import yaml
import sys

def setup_logging():
    # 🔥 FIX tiếng Việt cho console
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

    with open("config/logging.yaml", encoding="utf-8") as file:
        logging.config.dictConfig(yaml.safe_load(file))