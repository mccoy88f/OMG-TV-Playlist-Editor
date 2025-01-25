import { playlists as playlistsApi } from '@/lib/api';
import { PLAYLIST_STATUS } from '@/lib/constants';

export const createPlaylistsSlice = (set, get) => ({
 playlists: {
   items: [],
   currentPlaylist: null,
   loading: {
     list: false,
     sync: false,
     save: false,
     delete: false
   },
   error: null,
   syncStatus: {},
   
   loadPlaylists: async () => {
     set(state => ({
       playlists: { 
         ...state.playlists, 
         loading: { ...state.playlists.loading, list: true },
         error: null 
       }
     }));
     
     try {
       const items = await playlistsApi.getAll();
       set(state => ({
         playlists: { 
           ...state.playlists, 
           items,
           loading: { ...state.playlists.loading, list: false }
         }
       }));
     } catch (error) {
       set(state => ({
         playlists: {
           ...state.playlists,
           error: error.response?.data?.detail || 'Failed to load playlists',
           loading: { ...state.playlists.loading, list: false }
         }
       }));
     }
   },
   
   loadPlaylist: async (id) => {
     set(state => ({
       playlists: { 
         ...state.playlists, 
         loading: { ...state.playlists.loading, list: true },
         error: null
       }
     }));
     
     try {
       const playlist = await playlistsApi.getOne(id);
       set(state => ({
         playlists: {
           ...state.playlists,
           currentPlaylist: playlist,
           loading: { ...state.playlists.loading, list: false }
         }
       }));
     } catch (error) {
       set(state => ({
         playlists: {
           ...state.playlists,
           error: error.response?.data?.detail || 'Failed to load playlist',
           loading: { ...state.playlists.loading, list: false }
         }
       }));
     }
   },
   
   createPlaylist: async (data) => {
     set(state => ({
       playlists: { 
         ...state.playlists,
         loading: { ...state.playlists.loading, save: true },
         error: null
       }
     }));
     
     try {
       const playlist = await playlistsApi.create(data);
       set(state => ({
         playlists: {
           ...state.playlists,
           items: [...state.playlists.items, playlist],
           loading: { ...state.playlists.loading, save: false }
         }
       }));
       return playlist;
     } catch (error) {
       set(state => ({
         playlists: {
           ...state.playlists,
           error: error.response?.data?.detail || 'Failed to create playlist',
           loading: { ...state.playlists.loading, save: false }
         }
       }));
       return null;
     }
   },
   
   updatePlaylist: async (id, data) => {
     set(state => ({
       playlists: {
         ...state.playlists,
         loading: { ...state.playlists.loading, save: true }
       }
     }));
     
     try {
       const updatedPlaylist = await playlistsApi.update(id, data);
       set(state => ({
         playlists: {
           ...state.playlists,
           items: state.playlists.items.map(p => 
             p.id === id ? updatedPlaylist : p
           ),
           currentPlaylist: state.playlists.currentPlaylist?.id === id 
             ? updatedPlaylist 
             : state.playlists.currentPlaylist,
           loading: { ...state.playlists.loading, save: false }
         }
       }));
       return updatedPlaylist;
     } catch (error) {
       set(state => ({
         playlists: {
           ...state.playlists,
           error: error.response?.data?.detail || 'Failed to update playlist',
           loading: { ...state.playlists.loading, save: false }
         }
       }));
       return null;
     }
   },

   deletePlaylist: async (id) => {
     set(state => ({
       playlists: {
         ...state.playlists,
         loading: { ...state.playlists.loading, delete: true }
       }
     }));

     try {
       await playlistsApi.delete(id);
       set(state => ({
         playlists: {
           ...state.playlists,
           items: state.playlists.items.filter(p => p.id !== id),
           currentPlaylist: state.playlists.currentPlaylist?.id === id 
             ? null 
             : state.playlists.currentPlaylist,
           loading: { ...state.playlists.loading, delete: false }
         }
       }));
       return true;
     } catch (error) {
       set(state => ({
         playlists: {
           ...state.playlists,
           error: error.response?.data?.detail || 'Failed to delete playlist',
           loading: { ...state.playlists.loading, delete: false }
         }
       }));
       return false;
     }
   },
   
   syncPlaylist: async (id) => {
     set(state => ({
       playlists: {
         ...state.playlists,
         loading: { ...state.playlists.loading, sync: true },
         syncStatus: {
           ...state.playlists.syncStatus,
           [id]: PLAYLIST_STATUS.SYNCING
         }
       }
     }));
     
     try {
       await playlistsApi.sync(id);
       await get().playlists.loadPlaylist(id);
       
       set(state => ({
         playlists: {
           ...state.playlists,
           loading: { ...state.playlists.loading, sync: false },
           syncStatus: {
             ...state.playlists.syncStatus,
             [id]: PLAYLIST_STATUS.SUCCESS
           }
         }
       }));
       return true;
     } catch (error) {
       set(state => ({
         playlists: {
           ...state.playlists,
           loading: { ...state.playlists.loading, sync: false },
           syncStatus: {
             ...state.playlists.syncStatus,
             [id]: PLAYLIST_STATUS.ERROR
           },
           error: error.response?.data?.detail || 'Sync failed'
         }
       }));
       return false;
     }
   },
   
   addChannel: async (playlistId, channel) => {
     try {
       const newChannel = await playlistsApi.addChannel(playlistId, channel);
       await get().playlists.loadPlaylist(playlistId);
       return newChannel;
     } catch (error) {
       set(state => ({
         playlists: {
           ...state.playlists,
           error: error.response?.data?.detail || 'Failed to add channel'
         }
       }));
       return null;
     }
   },

   updateChannel: async (channelId, channel) => {
     try {
       const updatedChannel = await playlistsApi.updateChannel(channelId, channel);
       const playlistId = state.playlists.currentPlaylist?.id;
       if (playlistId) {
         await get().playlists.loadPlaylist(playlistId);
       }
       return updatedChannel;
     } catch (error) {
       set(state => ({
         playlists: {
           ...state.playlists,
           error: error.response?.data?.detail || 'Failed to update channel'
         }
       }));
       return null;
     }
   },

   deleteChannel: async (channelId) => {
     try {
       await playlistsApi.deleteChannel(channelId);
       const playlistId = state.playlists.currentPlaylist?.id;
       if (playlistId) {
         await get().playlists.loadPlaylist(playlistId);
       }
       return true;
     } catch (error) {
       set(state => ({
         playlists: {
           ...state.playlists,
           error: error.response?.data?.detail || 'Failed to delete channel'
         }
       }));
       return false;
     }
   },

   updateChannelOrder: async (playlistId, channelOrders) => {
     try {
       await playlistsApi.reorderChannels(playlistId, channelOrders);
       await get().playlists.loadPlaylist(playlistId);
       return true;
     } catch (error) {
       set(state => ({
         playlists: {
           ...state.playlists,
           error: error.response?.data?.detail || 'Failed to reorder channels'
         }
       }));
       return false;
     }
   },

   clearError: () => {
     set(state => ({
       playlists: { ...state.playlists, error: null }
     }));
   },

   clearCurrent: () => {
     set(state => ({
       playlists: { ...state.playlists, currentPlaylist: null }
     }));
   }
 }
});