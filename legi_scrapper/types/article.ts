export type TitreTM = {
    id: string;
    titre: string;
    debut: string;
    fin: string;
}

export type Article = {
    id: string;
    etat: string;
    num: string;
    texte: string;
    dateDebut: string;
    dateFin: string;
    context: {
        titresTM: TitreTM[]
    }
}