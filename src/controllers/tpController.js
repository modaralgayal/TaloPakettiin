import { fetchWordPressPosts } from "../services/tpServices.js";

export const getPosts = async (req, res) => {
    try {
        const posts = await fetchWordPressPosts();
        return res.status(200).json(posts);
    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: error.message }); 
    }
};
