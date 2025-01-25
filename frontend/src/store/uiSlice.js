import { TOAST_TYPES, TIMINGS } from '@/lib/constants';

export const createUiSlice = (set, get) => ({
 ui: {
   toast: null,
   modal: null,
   modals: [],
   sidebar: {
     isOpen: true,
     content: null
   },
   
   showToast: (message, type = TOAST_TYPES.INFO) => {
     const toast = { id: Date.now(), message, type };
     
     set(state => ({
       ui: {
         ...state.ui,
         toast
       }
     }));

     setTimeout(() => {
       set(state => ({
         ui: {
           ...state.ui,
           toast: state.ui.toast?.id === toast.id ? null : state.ui.toast
         }
       }));
     }, TIMINGS.TOAST_DURATION);
   },

   clearToast: () => {
     set(state => ({
       ui: {
         ...state.ui,
         toast: null
       }
     }));
   },

   showModal: (content, options = {}) => {
     const modal = { id: Date.now(), content, ...options };
     
     set(state => ({
       ui: {
         ...state.ui,
         modals: [...state.ui.modals, modal],
         modal: content
       }
     }));
   },

   closeModal: () => {
     set(state => ({
       ui: {
         ...state.ui,
         modals: state.ui.modals.slice(0, -1),
         modal: state.ui.modals[state.ui.modals.length - 2]?.content || null
       }
     }));
   },

   toggleSidebar: () => {
     set(state => ({
       ui: {
         ...state.ui,
         sidebar: {
           ...state.ui.sidebar,
           isOpen: !state.ui.sidebar.isOpen
         }
       }
     }));
   },

   setSidebarContent: (content) => {
     set(state => ({
       ui: {
         ...state.ui,
         sidebar: {
           ...state.ui.sidebar,
           content
         }
       }
     }));
   }
 }
});