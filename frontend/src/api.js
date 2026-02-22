
export function setToken(token) {
    localStorage.setItem("token", token);
}

export function getToken() {
    return localStorage.getItem("token");
}

export function clearToken() {
    localStorage.removeItem("token");
}


const API_BASE = (import.meta.env.VITE_API_URL || "").trim();


function buildUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    if (!API_BASE) return path;

    const base = API_BASE.endsWith("/")
        ? API_BASE.slice(0, -1)
        : API_BASE;

    const p = path.startsWith("/") ? path : `/${path}`;

    return `${base}${p}`;
}


export default async function api(path, method = "GET", body) {
    const token = getToken();
    const url = buildUrl(path);

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Erro HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
        return res.json();
    }

    return null;
}