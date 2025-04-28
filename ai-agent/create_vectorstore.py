import os
import shutil
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv
from process_pdfs import load_and_split_pdfs # Import the function from previous step

load_dotenv()

# --- Configuration ---
FAISS_INDEX_PATH = "faiss_index" # Folder to save the index
# Use OpenAI's cheaper embedding model
EMBEDDING_MODEL_NAME = "text-embedding-3-small"

def create_and_save_vectorstore():
    """Loads chunks, creates embeddings, builds FAISS index, and saves locally."""
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY in .env file.")

    # 1. Load and Chunk Documents
    chunks = load_and_split_pdfs()
    if not chunks:
        print("No chunks generated from PDFs. Cannot create vector store.")
        return

    # 2. Initialize Embedding Model
    print(f"\nInitializing embedding model: {EMBEDDING_MODEL_NAME}")
    try:
        embeddings = OpenAIEmbeddings(
            model=EMBEDDING_MODEL_NAME,
            openai_api_key=openai_api_key
            # Consider adding chunk_size parameter if needed, e.g., chunk_size=1000
            # Based on OpenAI docs, typically not needed unless > 8191 tokens per input item
        )
    except Exception as e:
        print(f"Error initializing OpenAI Embeddings: {e}")
        return

    # 3. Create FAISS Vector Store from Chunks
    # This step makes API calls to OpenAI to get embeddings - this is where the small cost occurs.
    print("\nCreating FAISS vector store from document chunks...")
    print("(This may take a few minutes and will use OpenAI API credits...)")
    try:
        vectorstore = FAISS.from_documents(chunks, embeddings)
        print("-> Vector store created successfully.")
    except Exception as e:
        print(f"Error creating FAISS vector store: {e}")
        # Potentially add specific error handling for rate limits or auth errors
        return

    # 4. Save FAISS Index Locally
    # Create the directory if it doesn't exist
    if not os.path.exists(FAISS_INDEX_PATH):
        os.makedirs(FAISS_INDEX_PATH)
    elif os.path.isfile(os.path.join(FAISS_INDEX_PATH, "index.faiss")):
         # Optional: Clear old index if re-running
         print(f"Clearing old index files in {FAISS_INDEX_PATH}...")
         for filename in os.listdir(FAISS_INDEX_PATH):
             file_path = os.path.join(FAISS_INDEX_PATH, filename)
             try:
                 if os.path.isfile(file_path) or os.path.islink(file_path):
                     os.unlink(file_path)
                 elif os.path.isdir(file_path):
                     shutil.rmtree(file_path)
             except Exception as e:
                 print(f'Failed to delete {file_path}. Reason: {e}')


    print(f"\nSaving FAISS index to local path: {FAISS_INDEX_PATH}")
    try:
        vectorstore.save_local(FAISS_INDEX_PATH)
        print("-> FAISS index saved successfully.")
    except Exception as e:
        print(f"Error saving FAISS index: {e}")

if __name__ == "__main__":
    create_and_save_vectorstore()
    print("\nVector store creation process finished.")