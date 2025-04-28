import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from dotenv import load_dotenv
import logging

load_dotenv()

# --- Configuration ---
FAISS_INDEX_PATH = "faiss_index"
EMBEDDING_MODEL_NAME = "text-embedding-3-small"
LLM_MODEL_NAME = "gpt-4o-mini"
PYTHON_AGENT_PORT = 5001 # Define port

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:7070"])

vectorstore = None
qa_chain = None

try:
    logging.info("Initializing application components...")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("OpenAI API key not found.")

    logging.info(f"Loading embedding model: {EMBEDDING_MODEL_NAME}")
    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL_NAME, openai_api_key=openai_api_key)

    logging.info(f"Loading FAISS index from: {FAISS_INDEX_PATH}")
    if not os.path.exists(FAISS_INDEX_PATH):
         raise FileNotFoundError(f"FAISS index not found at {os.path.abspath(FAISS_INDEX_PATH)}")
    if not os.path.isdir(FAISS_INDEX_PATH):
         raise NotADirectoryError(f"Path {FAISS_INDEX_PATH} is not a directory.")
    vectorstore = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
    logging.info("FAISS index loaded successfully.")


    logging.info(f"Initializing LLM: {LLM_MODEL_NAME}")
    llm = ChatOpenAI(model_name=LLM_MODEL_NAME, temperature=0.4, openai_api_key=openai_api_key) # Slightly increased temp for friendlier tone

    # --- REVISED PROMPT TEMPLATE (v2) ---
    # Added persona, specific instructions on schedule context usage, and greeting handling.
    prompt_template = """Act as a friendly and helpful academic advisor assistant for a Grove City College student using the Schedule Builder application.

    Use the following pieces of context, primarily from the Grove City College course bulletin and status sheet, AND the user's current schedule context (provided below within the input block) ONLY IF the user's question specifically asks about their schedule, potential conflicts, courses they are taking, or planning advice related to their schedule.

    Prioritize answering the user's specific question accurately based on the retrieved document context. If the schedule context is relevant to the question, use it to provide more personalized answers.

    If the user asks a question not related to their schedule (e.g., about course descriptions, prerequisites found in the documents), answer based *only* on the retrieved document context.

    If the user just provides a simple greeting like "hi" or "hello", respond with a simple, friendly greeting and ask how you can help. Do NOT summarize their schedule in response to a simple greeting.

    If the necessary information isn't found in the retrieved documents or the provided schedule context, clearly state that you couldn't find the specific information requested. Do not make up information.

    Retrieved Document Context:
    {context}

    User Input (Question and Schedule Context Block):
    {question}

    Answer:"""

    CUSTOM_PROMPT = PromptTemplate(
        template=prompt_template, input_variables=["context", "question"]
    )
    # --- END PROMPT REVISION ---


    logging.info("Creating RetrievalQA chain with custom prompt...")
    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
        chain_type_kwargs={"prompt": CUSTOM_PROMPT}
    )

    logging.info("Application components initialized successfully.")

except Exception as e:
    logging.error(f"FATAL ERROR during initialization: {e}", exc_info=True)
    vectorstore = None
    qa_chain = None


# --- API Endpoint (No change needed in the logic here) ---
@app.route('/ask', methods=['POST'])
def ask_question():
    if not qa_chain:
        logging.error("QA chain accessed before initialization.")
        return jsonify({"error": "QA chain not initialized. Check server logs."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    question = data.get('question')
    schedule_context = data.get('current_schedule_context', 'User schedule context was not provided.')

    if not question:
        return jsonify({"error": "No question provided in the request body."}), 400

    logging.info(f"Received original question: {question}")
    logging.info(f"Received schedule context: {schedule_context[:200]}...")

    # Combine Question and Schedule Context
    combined_input = f"""User Question: {question}

User's Current Schedule Context:
{schedule_context}
"""
    logging.info(f"Combined input for QA chain: {combined_input[:300]}...")

    try:
        logging.info("Invoking QA chain with combined input...")
        result = qa_chain.invoke({
            "query": combined_input
        })
        answer = result.get('result', 'No answer found.')

        # Source document processing
        source_docs_content = []
        if 'source_documents' in result and result['source_documents']:
            logging.info(f"DEBUG: Found {len(result['source_documents'])} source documents in result.")
            for i, doc in enumerate(result['source_documents']):
                 source_info = {
                    "page_content": doc.page_content[:100] + "...",
                    "metadata": doc.metadata
                 }
                 source_docs_content.append(source_info)
                 if i == 0:
                     logging.info(f"DEBUG: Metadata of first source doc: {doc.metadata}")
        else:
            logging.info("DEBUG: No 'source_documents' found or list is empty in the result.")


        logging.info(f"DEBUG: Preparing to return answer: {answer[:100]}...")

        return jsonify({
            "answer": answer,
            "sources": source_docs_content
        })

    except Exception as e:
        logging.error(f"Error processing question '{question}': {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred while processing the question."}), 500

# --- Run Flask App ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=PYTHON_AGENT_PORT)