import os
import json
import cohere

from langchain.chat_models import ChatOpenAI
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores.chroma import Chroma
from json_loader import JSONLoader

from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser
from langchain.schema.prompt_template import format_document

from langchain.prompts import PromptTemplate
from langchain.schema import StrOutputParser
from langchain.schema.prompt_template import format_document
from langchain.schema.runnable import RunnableParallel, RunnablePassthrough

from langchain.globals import set_verbose
from langchain.globals import set_debug
from langchain.schema.messages import SystemMessage, HumanMessage

os.environ["OPENAI_API_KEY"] = "REPLACE_ME"
os.environ["COHERE_API_KEY"] = "REPLACE_ME"

co = cohere.Client(os.environ["COHERE_API_KEY"])

# set_debug(True)
# set_verbose(True)


loader = JSONLoader(
    file_path="./legi_scrapper/output.json",
)

documents = loader.load()

db = Chroma.from_documents(documents, OpenAIEmbeddings())

query = "Quelles sont les conditions d'héritage d'un bien immobilier lors d'un décès?"
docs = db.similarity_search(query, 100)

llm = ChatOpenAI(temperature=0, model_name="gpt-4-1106-preview")

reranked_indexes = co.rerank(
    query=query,
    documents=list(map((lambda x: x.page_content), docs)),
    model="rerank-multilingual-v2.0",
    top_n=25,
)

docs_reranked = []

for x in reranked_indexes:
    docs_reranked.append(docs[x.index])

header = """Instructions:\nRépondez à la question le plus précisément possible en vous basant sur les articles de loi du code civil ci-dessous et citez les sources de chaque article utilisé entre parenthèses.\n
N'utilisez que les articles de lois s'ils sont pertinents avec la question.\n
Si la réponse n'est pas contenue dans les articles de loi ci-dessous, précisez-le dans votre réponse.\n\nArticles de loi:\n"""

entries = list(map((lambda x: x.page_content), docs_reranked))
question = header + "\n".join(entries) + "\n\nQuestion: " + query

messages = [
    SystemMessage(content="You are an AI powered assistant for lawyers"),
    HumanMessage(content=question),
]

print(llm.predict_messages(messages))
