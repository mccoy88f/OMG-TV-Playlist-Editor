import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store';
import { isAuthenticated } from '@/lib/auth';

export function AuthGuard({ children }) {
 const navigate = useNavigate();
 const location = useLocation();
 const { checkAuth, refreshSession } = useStore(state => ({
   checkAuth: state.auth.checkAuth,
   refreshSession: state.auth.refreshSession
 }));

 useEffect(() => {
   const checkAuthentication = async () => {
     if (!isAuthenticated() && location.pathname !== '/login') {
       navigate('/login', { 
         replace: true,
         state: { from: location } 
       });
       return;
     }

     if (isAuthenticated()) {
       try {
         const isValid = await checkAuth();
         if (!isValid && location.pathname !== '/login') {
           const refreshed = await refreshSession();
           if (!refreshed) {
             navigate('/login', { 
               replace: true,
               state: { from: location }
             });
           }
         }
       } catch (error) {
         console.error('Auth check failed:', error);
         navigate('/login', { 
           replace: true,
           state: { from: location }
         });
       }
     }
   };

   checkAuthentication();
 }, [location.pathname, navigate, checkAuth, refreshSession]);

 useEffect(() => {
   if (isAuthenticated() && location.pathname === '/login') {
     const from = location.state?.from?.pathname || '/';
     navigate(from, { replace: true });
   }
 }, [location, navigate]);

 return children;
}