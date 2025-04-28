import os
import fitz # PyMuPDF
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from dotenv import load_dotenv

load_dotenv()

PDF_FOLDER = "data"
STATUS_SHEET_FILE = os.path.join(PDF_FOLDER, "ComputerScience_BS_2029.pdf")
# Ensure this filename matches the ~10 page CS bulletin excerpt you uploaded
BULLETIN_FILE = os.path.join(PDF_FOLDER, "2024-25 Bulletin.pdf")

def load_and_split_pdfs():
    """Loads status sheet and the already-excerpted CS bulletin"""
    all_docs = []
    print(f"Processing documents from folder: {PDF_FOLDER}")

    # 1. Load Status Sheet (Keep as is)
    print(f"Loading Status Sheet: {os.path.basename(STATUS_SHEET_FILE)}")
    try:
        loader_status = PyMuPDFLoader(STATUS_SHEET_FILE)
        docs_status = loader_status.load()
        for doc in docs_status:
             doc.metadata["source"] = "Status Sheet"
        all_docs.extend(docs_status)
        print(f"-> Loaded {len(docs_status)} pages from Status Sheet.")
    except Exception as e:
        print(f"Error loading status sheet: {e}")

    # 2. Load Bulletin Excerpt (Load ALL pages from this file)
    print(f"Loading Bulletin Excerpt: {os.path.basename(BULLETIN_FILE)}")
    try:
        loader_bulletin = PyMuPDFLoader(BULLETIN_FILE)
        docs_bulletin = loader_bulletin.load() # Load all pages
        print(f"-> Loaded {len(docs_bulletin)} pages from Bulletin Excerpt.")

        # --- REMOVE THE PAGE FILTERING IF BLOCK ---
        # We no longer need to filter pages since the file IS the CS section
        for doc in docs_bulletin:
            # Just add the metadata
            doc.metadata["source"] = "Course Bulletin (CS Section)"
        # --- END REMOVED FILTER ---

        all_docs.extend(docs_bulletin) # Add all loaded pages

    except Exception as e:
        print(f"Error loading or processing bulletin excerpt: {e}")


    if not all_docs:
        print("No documents loaded. Exiting.")
        return None

    print(f"\nTotal pages combined for processing: {len(all_docs)}")

    # 3. Chunking (same logic as before)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150
    )
    print("\nChunking combined documents...")
    chunks = text_splitter.split_documents(all_docs)
    print(f"-> Created {len(chunks)} chunks.")

    return chunks

if __name__ == "__main__":
    chunks = load_and_split_pdfs()
    if chunks:
         print("\nPDF processing (Status Sheet + CS Bulletin Excerpt) and chunking complete.")