import { getArticle } from "./api/getArticle";
import { getCodeTableOfContents } from "./api/getCodeTableOfContents";
import { getOAuthToken } from "./api/getOAuthToken";
import axios from "axios";
import { Section } from "./types/section";
import { Article } from "./types/article";
import { serializeArticles } from "./serializer/articles";

require('dotenv').config();

const articles: Article[] = [];

const extractSection = async (section: Section) => {
    console.log(`Extracting section ${section.title}...`);

    for (const sectionArticle of section.articles) {
        articles.push(await getArticle(sectionArticle.id));
        console.log(`Progress: ${articles.length} articles scrapped.`);
        await new Promise(r => setTimeout(r, 1000));
    }

    for (const subSection of section.sections) {
        await extractSection(subSection);
    }
}

const main = async () => {
    let token = await getOAuthToken();

    axios.interceptors.request.use((config) => {
        config.headers.Authorization = `Bearer ${token} `;
        return config;
    });

    const code = await getCodeTableOfContents();

    for (const book of code.sections) {
        token = await getOAuthToken();
        console.log(`Extracting book ${book.title}...`);
        await extractSection(book);
    }

    serializeArticles(code.title, articles);
}

main();