// Utilitaire d'appel API pour le frontend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // Retour au vrai serveur

// Cache pour éviter les requêtes multiples
const requestCache = new Map<string, Promise<unknown>>();

function getToken() {
  return localStorage.getItem('token');
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  // Force headers à être de type Record<string, string>
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const optHeaders = options.headers ? Object.fromEntries(Object.entries(options.headers as Record<string, string>)) : {};
  const headers = { ...baseHeaders, ...optHeaders };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Créer une clé unique pour cette requête
  const requestKey = `${options.method || 'GET'}:${path}:${JSON.stringify(options.body || '')}`;
  
  // Vérifier si une requête similaire est déjà en cours
  if (requestCache.has(requestKey)) {
    console.log(`🔄 Requête en cache trouvée pour: ${path}`);
    return requestCache.get(requestKey);
  }
  
  console.log(`🌐 Appel API: ${API_BASE_URL}${path}`);
  console.log(`📋 Headers:`, headers);
  
  // Créer la promesse de requête
  const requestPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
      });
      
      console.log(`📊 Status: ${res.status} ${res.statusText}`);
      console.log(`📊 Headers de réponse:`, Object.fromEntries(res.headers.entries()));
      
      // Lire le texte brut d'abord
      const rawText = await res.text();
      console.log(`📄 Texte brut reçu:`, rawText);
      
      // Puis parser en JSON
      let data;
      try {
        data = JSON.parse(rawText);
        console.log(`📦 Données parsées:`, data);
      } catch (parseError) {
        console.error('❌ Erreur parsing JSON:', parseError);
        console.error('❌ Texte qui n\'a pas pu être parsé:', rawText);
        throw new Error('Réponse invalide du serveur');
      }
      
      if (!res.ok) {
        throw new Error(data?.error || 'Erreur API');
      }
      return data;
    } catch (fetchError) {
      console.error('❌ Erreur fetch:', fetchError);
      throw fetchError;
    } finally {
      // Nettoyer le cache après un délai pour permettre les requêtes suivantes
      setTimeout(() => {
        requestCache.delete(requestKey);
      }, 1000);
    }
  })();
  
  // Stocker la promesse dans le cache
  requestCache.set(requestKey, requestPromise);
  
  return requestPromise;
}

function withApiPrefix(path: string) {
  return path.startsWith('/api') ? path : `/api${path}`;
}

export const api = {
  post: <T = unknown, R = unknown>(path: string, body?: T, options: RequestInit = {}): Promise<R> =>
    apiFetch(withApiPrefix(path), {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  get: <R = unknown>(path: string, options: RequestInit = {}): Promise<R> =>
    apiFetch(withApiPrefix(path), {
      method: 'GET',
      ...options,
    }),
  // Ajoute d'autres méthodes si besoin (put, delete...)
}; 