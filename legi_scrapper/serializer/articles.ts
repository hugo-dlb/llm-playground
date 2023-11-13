import fs from 'fs';
import { Article } from "../types/article";
import { serializeContext } from './titreTm';

type SerializedArticle = {
    sourceText: string;
    number: string;
    link: string;
    content: string;
    context: string;
    consolidatedText: string;
    startDate: string;
    endDate: string;
}

export const serializeArticles = (source: string, articles: Article[]) => {
    let output: SerializedArticle[] = [];

    for (const article of articles) {
        const context = serializeContext(article);

        output.push({
            sourceText: source,
            number: article.num,
            link: `https://www.legifrance.gouv.fr/codes/article_lc/${article.id}`,
            content: article.texte,
            context,
            consolidatedText: `[CONTEXT_START]\r\n\r\n${context}\r\n\r\n[CONTEXT_END]\r\n\r\n[CONTENT_START]\r\n\r\n${article.texte}\r\n\r\n[CONTENT_END]`,
            startDate: new Date(article.dateDebut).toISOString(),
            endDate: new Date(article.dateFin).toISOString(),
        });
    }

    fs.writeFileSync("./output.json", JSON.stringify(output, null, 4));
    console.log(`${articles.length} articles serialized in output.json.`);
}