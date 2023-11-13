import axios from "axios";
import { Article } from "../types/article";
import { Section } from "../types/section";

type GetCodeTableOfContentsResponse = {
    id: string;
    title: string;
    sections: Section[];
    articles: Article[];
}

export const getCodeTableOfContents = async () => {
    return axios.post<GetCodeTableOfContentsResponse>("https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app/consult/legi/tableMatieres", {
        "textId": "LEGITEXT000006070721",
        "nature": "CODE",
        "date": "2023-09-10"
    }).then(response => response.data);
}