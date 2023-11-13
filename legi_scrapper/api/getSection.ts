import axios from "axios";

type Entry = {
    liensArticles: {
        id: string;
    }[];
    liensSection: {
        id: string;
        titre: string;
    }[];
}

type GetArticleResponse = {
    listSection: Entry[];
}

export const getSection = async (id: string) => {
    return axios.post<GetArticleResponse>("https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app/consult/getArticle", {
        id
    }).then(response => response.data);
}