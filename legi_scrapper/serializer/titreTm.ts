import { Article } from "../types/article";

export const serializeContext = (article: Article) => {
    let output = '';

    for (const entry of article.context.titresTM) {
        output += `${entry.titre}\r\n\r\n`;
    }

    output += `Article ${article.num}`;

    return output;
}