// Use environment variable if available
// For local development, use empty string to leverage Vite proxy (avoids CORS issues)
// For production, use the full Azure backend URL

// azure backend URL
// const API_BASE_URL ="https://sagealpha-ai-backend-node-c2eea3fpf5b2cfcb.centralindia-01.azurewebsites.net";



// ngrok backend URL
// const API_BASE_URL = "https://threadlike-nondemocratically-jurnee.ngrok-free.dev";

// render.com backend URL
const API_BASE_URL = "https://sagealpha-backend-render.onrender.com";


// const API_BASE_URL = "http://localhost:8000";


const CONFIG = {
    API_BASE_URL: API_BASE_URL,
};

export default CONFIG;
