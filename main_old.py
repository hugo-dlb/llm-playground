import os
import time
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores.chroma import Chroma
from json_loader import JSONLoader
from langchain.chat_models import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

# OpenAI API key given when creating an account
os.environ["OPENAI_API_KEY"] = "REPLACE_ME"

# loading the JSON file containing all the Code Civil articles
loader = JSONLoader(
    file_path="./legi_scrapper/output.json",
)

documents = loader.load()

# Loading the documents into the vector database as embeddings by using OpenAI LLMs
db = Chroma.from_documents(documents, OpenAIEmbeddings())

# Arbitrary query
query = "Quelles sont les conditions de succession d’un bien immobilier lors du décès du propriétaire ?"

# Retrieve the best similarity matches
docs = db.similarity_search(query, k=50)

# ChatGPT instructions that will be fed in the prompt
header = """Instructions:\nRépondez à la question le plus sincèrement possible en vous basant sur les articles de loi ci-dessous et citez les sources de chaque article utilisé entre parenthèses.\n
Si la réponse n'est pas contenue dans les articles de loi ci-dessous, précisez-le dans votre réponse.\n\nArticles de loi:\n"""

best_matches = list(map((lambda x: x.page_content), docs))
# Build a string containing the instructions, the best matches and the query
question = header + "\n".join(best_matches) + "\n\nQuestion: " + query

print(question)

messages = [
    SystemMessage(content="You are an AI powered assistant for lawyers."),
    HumanMessage(content=question),
]

# Specify the LLM as well as some other settings
llm = ChatOpenAI(
    temperature=0.5,
    model_name="gpt-3.5-turbo-16k",
)
# Ask the query to ChatGPT and display the response in the console
start = time.time()
print(llm.predict_messages(messages).content)
end = time.time()
print(str(end - start) + "s elapsed")
