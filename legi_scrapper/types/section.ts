import { SectionArticle } from "./sectionArticle";

export type Section = {
    id: string;
    title: string;
    sections: Section[];
    articles: SectionArticle[];
}