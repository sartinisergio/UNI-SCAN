#!/usr/bin/env python3
import json
import os

# Leggi il file JSON originale da Dropbox (scaricato localmente per test)
# Per ora, leggiamo il file che dovrebbe essere in /home/ubuntu/upload o simile

# Verifica quale file esiste
test_files = [
    "/home/ubuntu/upload/Economia_politica.json",
    "/home/ubuntu/upload/Framework_Economia_Politica.json",
]

original_file = None
for f in test_files:
    if os.path.exists(f):
        original_file = f
        break

if not original_file:
    print("File originale non trovato")
    print("File cercati:", test_files)
    exit(1)

# Leggi il file originale
with open(original_file, 'r') as f:
    original_content = f.read()
    original_json = json.loads(original_content)

print(f"File originale: {original_file}")
print(f"Lunghezza: {len(original_content)} caratteri")
print(f"Righe: {len(original_content.splitlines())}")
print(f"\nPrime chiavi: {list(original_json.keys())[:5]}")
print(f"Ultime chiavi: {list(original_json.keys())[-5:]}")
print(f"\nInizio JSON:")
print(json.dumps(original_json, indent=2)[:300])
print(f"\nFine JSON:")
print(json.dumps(original_json, indent=2)[-300:])
