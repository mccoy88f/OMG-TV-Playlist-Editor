import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'omg_token';
const REFRESH_TOKEN_KEY = 'omg_refresh_token';

// Funzioni per access token
export const setAuthToken = (token) => {
 sessionStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = () => {
 return sessionStorage.getItem(TOKEN_KEY);
};

export const removeAuthToken = () => {
 sessionStorage.removeItem(TOKEN_KEY);
};

// Funzioni per refresh token
export const setRefreshToken = (token) => {
 localStorage.setItem(REFRESH_TOKEN_KEY, token);
};

export const getRefreshToken = () => {
 return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const removeRefreshToken = () => {
 localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const isAuthenticated = () => {
 const token = getAuthToken();
 if (!token) return false;

 try {
   const decoded = jwtDecode(token);
   const currentTime = Date.now() / 1000;
   return decoded.exp > currentTime;
 } catch {
   return false;
 }
};

export const getUserFromToken = () => {
 const token = getAuthToken();
 if (!token) return null;

 try {
   const decoded = jwtDecode(token);
   return {
     username: decoded.sub,
     exp: decoded.exp
   };
 } catch {
   return null;
 }
};

export const logout = () => {
 removeAuthToken();
 removeRefreshToken();
};