import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated } from '@/lib/auth';

export function RequireAuth({ children }) {
 const location = useLocation();
 const authenticated = isAuthenticated();

 if (!authenticated) {
   return <Navigate 
     to="/login" 
     state={{ from: location }} 
     replace 
   />;
 }

 return (
   <React.Fragment>
     {children}
   </React.Fragment>
 );
}