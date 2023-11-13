import json
from pathlib import Path
from langchain.docstore.document import Document
from langchain.document_loaders.base import BaseLoader
from typing import List, Optional, Union


class JSONLoader(BaseLoader):
    def __init__(
        self,
        file_path: Union[str, Path],
    ):
        self.file_path = Path(file_path).resolve()

    def load(self) -> List[Document]:
        """Load and return documents from the JSON file."""
        docs = []

        with open(self.file_path, encoding="utf-8") as file:
            articles = json.load(file)

            for article in articles:
                metadata = {
                    "number": article["number"],
                    "link": article["link"],
                    "content": article["content"],
                }
                docs.append(
                    Document(
                        page_content="Article "
                        + article["number"]
                        + ": "
                        + article["content"],
                        metadata=metadata,
                    )
                )

        return docs
