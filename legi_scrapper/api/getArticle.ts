import axios from "axios";
import { Article } from "../types/article";

type GetArticleResponse = {
    article: Article;
}

export const getArticle = async (id: string) => {
    return axios.post<GetArticleResponse>("https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app/consult/getArticle", {
        id
    }).then(response => response.data.article);
}