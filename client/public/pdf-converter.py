import tkinter as tk
from tkinter import filedialog, messagebox
from pypdf import PdfReader
import os
import sys

print("Avvio PDF Extractor...")

def seleziona_e_converti():
    try:
        root = tk.Tk()
        root.withdraw()
        
        pdf_path = filedialog.askopenfilename(
            title="Scegli PDF Zanichelli",
            filetypes=[("PDF", "*.pdf")]
        )
        
        if not pdf_path:
            print("Annullato.")
            return
        
        print(f"PDF selezionato: {pdf_path}")
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        nome_base = os.path.splitext(os.path.basename(pdf_path))[0]
        txt_path = os.path.join(script_dir, f"{nome_base}.txt")
        
        print("Estrazione in corso...")
        reader = PdfReader(pdf_path)
        testo = ""
        for i, page in enumerate(reader.pages, 1):
            testo += f"\n--- PAGINA {i} ---\n{page.extract_text()}\n"
        
        with open(txt_path, "w", encoding="utf-8") as f:
            f.write(testo)
        
        os.startfile(txt_path) if sys.platform == "win32" else os.system(f"open {txt_path}")
        print(f"✓ Creato e aperto: {txt_path}")
        messagebox.showinfo("OK", f"File: {os.path.basename(txt_path)}")
        
    except Exception as e:
        print(f"ERRORE: {e}")
        messagebox.showerror("Errore", str(e))

if __name__ == "__main__":
    seleziona_e_converti()
    input("\nPremi Invio per uscire...")
