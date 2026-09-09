import axios from 'axios';

const api = axios.create({
    baseURL: 'https://localhost:7000', // 你的 .NET API 網址
    withCredentials: true, // 關鍵：允許跨域攜帶 Cookie
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;