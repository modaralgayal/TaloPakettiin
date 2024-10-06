import axios from "axios";

const baseUrl = 'https://bur.hdn.mybluehost.me';

export const fetchWordPressPosts = async () => {
    try {
        const response = await axios.get(`${baseUrl}/sign-in-page`);
        console.log(response.data)
        return response.data;
    } catch (error) {
        console.error('Error fetching data from WordPress:', error.message);
        throw new Error('Failed to fetch data from WordPress'); 
    }
};
