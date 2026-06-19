import os
import sys
import subprocess

try:
    import pypdf
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf"])
    import pypdf

pdf_path = "C:\\Users\\PC\\Desktop\\청소타워 파트너 안내 Q&A 답변서.pdf"
if os.path.exists(pdf_path):
    print("Reading original PDF content...")
    reader = pypdf.PdfReader(pdf_path)
    print(f"Total pages: {len(reader.pages)}")
    for i in range(min(5, len(reader.pages))):
        print(f"--- PAGE {i+1} ---")
        print(reader.pages[i].extract_text()[:500])
else:
    print("Original PDF does not exist at path.")
