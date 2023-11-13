# LLM Playground

This is a playground to explore LLM capabilities. The use case will be to make an AI assistance for lawyers that is able to search through the [Code Civil](https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070721/) by using [natural language](https://www.algolia.com/blog/product/what-is-natural-language-search/).

> This README documents the process followed for the file `main_old.py`, which has since been updated to leverage ChatGPT 4 and [Cohere](https://cohere.com/rerank) reranking API in the file `main.py`.

# An introduction to LLMs

Large Language Models (LLMs) are advanced artificial intelligence models that have been trained on vast amounts of text data. These models have the capability to generate human-like text and understand natural language inputs. They are designed to learn patterns, context, and semantics from the training data, enabling them to generate coherent and contextually relevant responses. With their ability to understand and generate human language, LLMs have the potential to revolutionize various industries, including the legal field, by providing intelligent assistance and enhancing productivity for professionals like lawyers.

# Choosing a LLM

ChatGPT, created by OpenAI, seems to be the [best performing LLM](https://benchmarks.llmonitor.com/), although benchmarks comparing different LLMs are not yet mature. The [Open LLM Leaderboard](https://huggingface.co/spaces/HuggingFaceH4/open_llm_leaderboard) is one the more reliable benchmark as it tests a variety of reasoning and general knowledge across a wide variety of fields, but it does not include non open source models like ChatGPT.

Some models are better than others in different areas (content generation, Q/A, problem solving, inference…) and it takes a lot of experimenting to make an informed decision about choosing a specific model to solve a specific problem.

Training a LLM is a very expensive and time consuming process that should be avoided whenever possible, especially when the training data is changing frequently (as it is the case with the law). Therefore, it is best to use a pretrained model (like ChatGPT). Some pretrained models are also open source, and in this case it is possible to improve it further by finetuning it, aka training it further on custom data that could be related to a specific domain expertise. For the scope of this POC, we’ll use ChatGPT.

# Using a LLM with business specific data

While ChatGPT excels at reasoning, its training data stops until September 2021. This means that any question regarding the French law will not take in consideration laws introduced after this date. Moreover, it is very unlikely that ChatGPT is aware of all laws, especially of a specific country. Because of these limitations, we need a way to provide the LLM access to an external source of data. In our case, we also have to take in account the fact that the law is a living document that is updated regularly.

Enter [Retrieval Augmented Generation](https://www.promptingguide.ai/techniques/rag).

> General-purpose language models can be fine-tuned to achieve several common tasks such as sentiment analysis and named entity recognition. These tasks generally don't require additional background knowledge.
>
> For more complex and knowledge-intensive tasks, it's possible to build a language model-based system that accesses external knowledge sources to complete tasks. This enables more factual consistency, improves reliability of the generated responses, and helps to mitigate the problem of "hallucination".
>
> Source: **[Retrieval Augmented Generation (RAG), promptingguide.ai](https://www.promptingguide.ai/techniques/rag)**

The most common systems used to provide external data for RAG LLMs are [vector databases](https://www.elastic.co/what-is/vector-database). Vector databases can store structured or unstructured data by converting them into numerical vectors. This allows to perform Nearest Neighbor algorithms in a fast and accurate manner.

![Figure 1, Source: [**How does a vector database work? elastic.co**](https://www.elastic.co/what-is/vector-database)](https://images.contentstack.io/v3/assets/bltefdd0b53724fa2ce/blt185ef72de6dc0e43/6466a9a1f21a3540facf75ac/vector-search-diagram-cropped-white-space.png)

Figure 1, Source: [**How does a vector database work? elastic.co**](https://www.elastic.co/what-is/vector-database)

The process of using a vector database looks like the following:

1. A dataset of documents (in our case the Code Civil) is split into chunks (in our case _articles de loi_), and each chunk is transformed into an embedding (vector representation) through a LLM
2. Embeddings are stored in the vector database
3. When a query comes in (e.g. “Quelles sont les conditions de succession d’un bien immobilier lors du décès du propriétaire ?”), it is transformed into an embedding
4. A Nearest neighbour algorithm is performed inside the vector database to find chunks that have the highest similarities with the query embedding
5. The top k (configurable) best similarity matches are returned from the vector database

The real power of RAG comes in when combining the similarity search capabilities of the vector database with the reasoning capabilities of a LLM. The best matches can be fed into the LLM prompt along with the initial query, and the LLM can be instructed to only (or partially) rely on this data as a source of truth to generate the answer.

# Choosing a vector database

There are many offerings available on the market. Like the LLMs, in a real world setting with a production grade application in mind, several options should be benchmarked. Some vendor specific features may also be interesting, such as Pinecone fully-managed offering which handles all the infrastructure (including scaling horizontally to support large amounts of data). Making an educated choice goes beyond the scope of this POC: we’ll use the open source vector database [chroma](https://github.com/chroma-core/chroma) which is easy to get running locally and doesn’t use many resources.

# Retrieving the Code Civil data

The Code Civil, is [available publicly](https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000006070721/) on the world wide web. While this format is convenient for humans, it is not for a system that we need to be able to query in a fast and optimized manner.

Ideally we would like to have our own database structured in a way that makes the chunking easier, and still have room for flexibility should the LLM be complimented by other refinement techniques in the future (such as executing SQL queries).

In essence, we need to run an [Extract, Transform and Load](https://www.ibm.com/topics/etl) (ETL) pipeline. The source will be the Code Civil public APIs (exposed via the [Légifrance PISTE developer portal](https://developer.aife.economie.gouv.fr/en/)), the data will be transformed into a format that only preserves the fields relevant for the RAG LLM (see Figure 2 below), and will be loaded into a JSON file saved on the local hard drive.

```jsx
[
    {
        sourceText: "Code civil",
        number: 18,
        link: "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006419373",
        content:
            "Est français l'enfant dont l'un des parents au moins est français.",
        context:
            "Livre Ier : Des personnes\r\n\r\nTitre Ier bis : De la nationalité française\r\n\r\nChapitre II : De la nationalité française d'origine\r\n\r\nSection 1 : Des Français par filiation\r\n\r\nArticle 18",
        consolidatedText:
            "[CONTEXT_START]\r\n\r\nLivre Ier : Des personnes\r\n\r\nTitre Ier bis : De la nationalité française\r\n\r\nChapitre II : De la nationalité française d'origine\r\n\r\nSection 1 : Des Français par filiation\r\n\r\nArticle 18\r\n\r\n[CONTEXT_END]\r\n\r\n[CONTENT_START]\r\n\r\nEst français l'enfant dont l'un des parents au moins est français.\r\n\r\n[CONTENT_END]",
        startDate: "2006-07-01T00:00:00.000Z",
        endDate: "2999-01-01T00:00:00.000Z",
    },
    // other articles...
];
```

While the Légifrance API is free, it also has rate limits which allows approximately one request per second. The Code Civil contains about 2 000 articles, so a rough estimate to retrieve all its content and transform it is one hour.

<aside>
💡 In a real world application, it would be wise to preserve as much data as possible from the API rather than narrowing down the data to a subset of properties. This would prevent the need to scrap the whole Code Civil everytime you realize you’re interested in using new properties from the original data.

</aside>

For the context of this POC, we will not explore solutions to update our database when the Code Civil changes.

When interracting with a REST API, it is convenient to use Javascript since the JSON format returned can be natively exploited.

```jsx
// function to extract the articles of a given section
const extractSection = async (section: Section) => {
    const articles: Article[] = [];
    let nestedArticles: Article[] = [];

    for (const sectionArticle of section.articles) {
        articles.push(await getArticle(sectionArticle.id));
        // wait one second due to rate limiting
        await new Promise((r) => setTimeout(r, 1000));
    }

    for (const subSection of section.sections) {
        nestedArticles = await extractSection(subSection);
    }

    return [...articles, ...nestedArticles];
};

// main function
const main = async () => {
    const token = await getOAuthToken();

    axios.interceptors.request.use((config) => {
        config.headers.Authorization = `Bearer ${token} `;
        return config;
    });

    const code = await getCodeTableOfContents();
    const articles: Article[] = [];

    for (const book of code.sections) {
        for (const title of book.sections) {
            for (const chapter of title.sections) {
                for (const section of chapter.sections) {
                    articles.push(...(await extractSection(section)));
                }
            }
        }
    }

    // saves the articles in a JSON file
    serializeArticles(code.title, articles);
};
```

# Putting everything together

As the whole AI / Data Science community is using the Python programming language, there’s not much room for subjectivity here. An overview of the ETL code in Python can be seen in Figure 3 below.

We’ll use the Python AI framework [Langchain](https://www.langchain.com/) to orchestrate the whole process. It allows to quickly prototype LLM applications, however it’s usage in production is criticized and discouraged due to the poor documentation quality and uneasiness of debugging.

The steps will be the following:

1. Transform each entry from the JSON file (only using the _consolidatedText_ property) into embeddings (vector representations of the data)
2. Store the embeddings in the chroma vector database
3. Perform a similarity search from a predefined query
4. Retrieve the best matches
5. Feed the best matches, the query and instructions to ChatGPT all together
6. Display ChatGPT answer in the console

Thanks to Langchain, the code is very lean (see the overview in Figure 4 below).

```python
import os
from langchain.llms import OpenAI
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import Chroma
from json_loader import JSONLoader

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

# Retrieve the 10 best similarity matches
docs = db.similarity_search(query, k=10)

# ChatGPT instructions that will be fed in the prompt
header = """Instructions:\nRépondez à la question le plus sincèrement possible en vous basant sur les articles de loi ci-dessous et citez les sources de chaque article utilisé entre parenthèses.\n
Chaque article de loi possède un contexte, délimité par les balises [CONTEXT_START] et [CONTEXT_END].\n
Le contenu de chaque article de loi est délimité par les balises [CONTENT_START] et [CONTENT_END].\n
Si la réponse n'est pas contenue dans les articles de loi ci-dessous, précisez-le dans votre réponse.\n\n\Articles de loi:\n"""

best_matches = list(map((lambda x: x.page_content), docs))
# Build a string containing the instructions, the best matches and the query
question = header + "".join(best_matches) + "\n\nQuestion: " + query + "\n\n Réponse:"

# Specify the LLM as well as some other settings
llm = OpenAI(temperature=0, max_tokens=-1, model_name="gpt-3.5-turbo-16k")
# Ask the query to ChatGPT and display the response in the console
print(llm.predict(question))
```

When running the Python script (see `main_old.py` in the repo), we get an answer:

```txt
Les conditions de succession d'un bien immobilier lors du décès du propriétaire sont définies par la loi. Selon l'article 720 du Code civil, les successions s'ouvrent par la mort, au dernier domicile du défunt. Cela signifie que la succession d'un bien immobilier est ouverte au moment du décès du propriétaire.

En ce qui concerne l'attribution préférentielle du bien immobilier, l'article 831-2 du Code civil stipule que le conjoint survivant ou tout héritier copropriétaire peut demander l'attribution préférentielle de la propriété du bien immobilier s'il s'agit de sa résidence principale au moment du décès. Cette demande peut également être faite pour le droit au bail du local servant effectivement d'habitation. De plus, le mobilier garnissant le bien immobilier peut également être attribué préférentiellement. (Article 831-2)

Il est important de noter que si le bien immobilier est grevé de rentes par hypothèque spéciale, chaque cohéritier a le droit d'exiger que les rentes soient remboursées et que les immeubles soient rendus libres avant la formation des lots. Si les cohéritiers décident de partager la succession dans l'état où elle se trouve, l'immeuble grevé doit être estimé au même taux que les autres immeubles et le capital de la rente doit être déduit du prix total. L'héritier dans le lot duquel se trouve cet immeuble est seul responsable du service de la rente et doit en garantir ses cohéritiers. (Article 872)

En résumé, les conditions de succession d'un bien immobilier lors du décès du propriétaire sont que la succession s'ouvre au moment du décès, que le conjoint survivant ou tout héritier copropriétaire peut demander l'attribution préférentielle du bien immobilier s'il s'agit de sa résidence principale, et que si le bien est grevé de rentes par hypothèque spéciale, des dispositions spécifiques s'appliquent. (Article 720, Article 831-2, Article 872)
```
