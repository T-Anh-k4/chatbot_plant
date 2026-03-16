from api.routes.chat import chat

def main():
    print("ALF NMK Chatbot (type 'exit' to quit)")
    while True:
        question = input("\nYou: ")
        if question.lower() in ["exit", "quit"]:
            break

        answer = chat(question)
        print(f"\nBot: {answer}")

if __name__ == "__main__":
    main()
    print("Vector DB:", vector_db)
    print("Embedder:", embedder)
    print("RAG ready:", READY)