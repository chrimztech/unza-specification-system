"""Rebuild both system documents into docs/.

    python docs/generator/build.py

Requires Python 3 with reportlab (`pip install reportlab`) and the Windows Segoe UI / Consolas fonts.
Edit tech.py or manual.py to change the content; docgen.py holds the shared layout and UNZA colours.
"""
import subprocess
import sys
from pathlib import Path

here = Path(__file__).resolve().parent
docs = here.parent
logo = docs.parent / "public" / "logo.png"
for script, pdf in (("tech.py", "UNZA-CICT-Technical-Documentation.pdf"),
                    ("manual.py", "UNZA-CICT-User-Manual.pdf")):
    subprocess.run([sys.executable, str(here / script), str(docs / pdf), str(logo)], cwd=here, check=True)
    print("built", docs / pdf)
