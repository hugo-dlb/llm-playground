import axios from "axios";

type GetOAuthTokenResponse = {
    access_token: string;
}

export const getOAuthToken = async () => {
    return axios.post<GetOAuthTokenResponse>("https://sandbox-oauth.piste.gouv.fr/api/oauth/token", new URLSearchParams({
        'grant_type': 'client_credentials',
        'client_id': process.env.client_id!,
        'client_secret': process.env.client_secret!,
        'scope': 'openid'
    })).then(response => response.data.access_token);
}