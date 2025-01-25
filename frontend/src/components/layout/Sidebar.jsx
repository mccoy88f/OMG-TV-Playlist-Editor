import React, { useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';
import { Library, ListMusic, Settings, PlusCircle, X } from 'lucide-react';

export function Sidebar() {
 const location = useLocation();
 const { isOpen, toggleSidebar } = useStore(state => ({
   isOpen: state.ui.sidebar.isOpen,
   toggleSidebar: state.ui.toggleSidebar
 }));

 const navigation = [
   {
     name: 'All Playlists',
     href: '/playlists',
     icon: Library,
     match: /^\/playlists(?!\/add)/
   },
   {
     name: 'Add Playlist',
     href: '/playlists/add',
     icon: PlusCircle,
     match: /^\/playlists\/add/
   },
   {
     name: 'Settings',
     href: '/settings',
     icon: Settings,
     match: /^\/settings/
   }
 ];

 const handleCloseSidebar = useCallback(() => {
   if (window.innerWidth < 1024) {
     toggleSidebar();
   }
 }, [toggleSidebar]);

 return (
   <>
     {isOpen && (
       <div 
         className="fixed inset-0 z-40 bg-black/50 lg:hidden"
         onClick={toggleSidebar}
         aria-hidden="true"
       />
     )}

     <aside
       className={cn(
         'fixed inset-y-0 left-0 z-40 w-64 transform bg-white shadow-lg transition-transform lg:static lg:translate-x-0',
         isOpen ? 'translate-x-0' : '-translate-x-full'
       )}
     >
       <div className="flex h-16 items-center justify-between px-4 lg:hidden">
         <span className="text-lg font-semibold">Menu</span>
         <button
           onClick={toggleSidebar}
           className="rounded-md p-2 hover:bg-gray-100"
           aria-label="Close sidebar"
         >
           <X className="h-5 w-5" />
         </button>
       </div>

       <nav className="space-y-1 p-4">
         {navigation.map((item) => {
           const isActive = item.match.test(location.pathname);
           const Icon = item.icon;

           return (
             <Link
               key={item.name}
               to={item.href}
               onClick={handleCloseSidebar}
               className={cn(
                 'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                 isActive
                   ? 'bg-blue-50 text-blue-600'
                   : 'text-gray-700 hover:bg-gray-100'
               )}
             >
               <Icon 
                 className={cn(
                   'mr-3 h-5 w-5',
                   isActive ? 'text-blue-600' : 'text-gray-400'
                 )}
               />
               {item.name}
             </Link>
           );
         })}
       </nav>

       <div className="absolute bottom-0 w-full border-t border-gray-200 p-4">
         <div className="flex items-center space-x-3">
           <ListMusic className="h-8 w-8 text-gray-400" />
           <div className="text-sm">
             <p className="font-medium text-gray-900">
               OMG Playlist Manager
             </p>
             <p className="text-gray-500">
               Version {import.meta.env.VITE_APP_VERSION || '0.1.0'}
             </p>
           </div>
         </div>
       </div>
     </aside>
   </>
 );
}