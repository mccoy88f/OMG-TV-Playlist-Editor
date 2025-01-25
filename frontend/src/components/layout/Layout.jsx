import React from 'react';
import { useStore } from '@/store';
import { Outlet } from 'react-router-dom';
import { Toast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function Layout() {
 const { toast, modals, clearToast, closeModal } = useStore(state => ({
   toast: state.ui.toast,
   modals: state.ui.modals,
   clearToast: state.ui.clearToast,
   closeModal: state.ui.closeModal
 }));

 return (
   <div className="min-h-screen bg-gray-100">
     <Header />
     
     <div className="flex">
       <Sidebar />
       
       <main className="flex-1 overflow-auto p-6">
         <div className="mx-auto max-w-7xl">
           <Outlet />
         </div>
       </main>
     </div>

     {toast && (
       <Toast
         message={toast.message}
         type={toast.type}
         onClose={clearToast}
       />
     )}

     {modals.map((modal, index) => (
       <Modal
         key={modal.id}
         isOpen={true}
         onClose={() => closeModal()}
         {...modal}
         isTopmost={index === modals.length - 1}
       />
     ))}
   </div>
 );
}