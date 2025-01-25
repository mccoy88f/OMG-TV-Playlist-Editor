import { auth as authApi } from '@/lib/api';
import { 
 setAuthToken, removeAuthToken, getUserFromToken,
 setRefreshToken, removeRefreshToken 
} from '@/lib/auth';

export const createAuthSlice = (set, get) => ({
 auth: {
   user: getUserFromToken(),
   loading: false,
   error: null,
   
   login: async (username, password) => {
     set(state => ({
       auth: { ...state.auth, loading: true, error: null }
     }));
     
     try {
       const response = await authApi.login(username, password);
       setAuthToken(response.access_token);
       setRefreshToken(response.refresh_token);
       const user = getUserFromToken();
       
       set(state => ({
         auth: { ...state.auth, user, loading: false }
       }));
       
       return true;
     } catch (error) {
       const errorMsg = error.response?.data?.detail || 'Login failed';
       set(state => ({
         auth: {
           ...state.auth,
           error: errorMsg,
           loading: false
         }
       }));
       return false;
     }
   },
   
   logout: () => {
     removeAuthToken();
     removeRefreshToken();
     set(state => ({
       auth: { ...state.auth, user: null }
     }));
   },
   
   checkAuth: async () => {
     try {
       const user = await authApi.getMe();
       set(state => ({
         auth: { ...state.auth, user }
       }));
       return true;
     } catch (error) {
       removeAuthToken();
       removeRefreshToken();
       set(state => ({
         auth: { ...state.auth, user: null }
       }));
       return false;
     }
   },
   
   refreshSession: async () => {
     try {
       const refreshToken = getRefreshToken();
       if (!refreshToken) {
         throw new Error('No refresh token');
       }

       const response = await authApi.refreshToken(refreshToken);
       setAuthToken(response.access_token);
       setRefreshToken(response.refresh_token);
       
       const user = getUserFromToken();
       set(state => ({
         auth: { ...state.auth, user }
       }));
       
       return true;
     } catch (error) {
       removeAuthToken();
       removeRefreshToken();
       set(state => ({
         auth: { ...state.auth, user: null }
       }));
       return false;
     }
   },

   clearError: () => {
     set(state => ({
       auth: { ...state.auth, error: null }
     }));
   }
 }
});