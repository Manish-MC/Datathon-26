import sys
import os
sys.path.append('backend')
import csv
from app.services.nlp_summarizer import generate_summary

with open('backend/sample_data/fir_sample.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    with open('results.txt', 'w', encoding='utf-8') as out:
        for i, row in enumerate(reader):
            if i >= 5: break
            out.write(f"Case: {row['CrimeNo']}\n")
            out.write(f"Original: {row['BriefFacts']}\n")
            out.write(f"Summary:\n{generate_summary(row['BriefFacts'])}\n\n")
