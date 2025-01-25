import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate, getPublicPlaylistUrl } from '@/lib/utils';
import { RefreshCcw, Link as LinkIcon, Download, Edit, Copy, ExternalLink, Trash2 } from 'lucide-react';

export function PlaylistList({ playlists = [] }) {
 const { syncPlaylist, deletePlaylist, showModal } = useStore(state => ({
   syncPlaylist: state.playlists.syncPlaylist,
   deletePlaylist: state.playlists.deletePlaylist,
   showModal: state.ui.showModal
 }));

 const sortedPlaylists = useMemo(() => 
   [...playlists].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
   [playlists]
 );

 const handleSync = async (id) => {
   try {
     await syncPlaylist(id);
   } catch (error) {
     showModal({
       title: 'Sync Failed',
       children: <p>{error.message}</p>
     });
   }
 };

 const handleDelete = (playlist) => {
   showModal({
     title: 'Delete Playlist',
     children: (
       <div className="space-y-4">
         <p>Are you sure you want to delete "{playlist.name}"?</p>
         <div className="flex justify-end space-x-2">
           <Button variant="ghost" onClick={() => showModal(null)}>Cancel</Button>
           <Button 
             variant="destructive"
             onClick={async () => {
               try {
                 await deletePlaylist(playlist.id);
                 showModal(null);
               } catch (error) {
                 showModal({
                   title: 'Error',
                   children: <p>{error.message}</p>
                 });
               }
             }}
           >
             Delete
           </Button>
         </div>
       </div>
     )
   });
 };

 if (playlists.length === 0) {
   return (
     <Card>
       <CardContent className="py-8 text-center">
         <p className="text-gray-500">No playlists found</p>
         <Link to="/playlists/add">
           <Button className="mt-4">Add Playlist</Button>
         </Link>
       </CardContent>
     </Card>
   );
 }

 return (
   <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
     {sortedPlaylists.map(playlist => (
       <Card key={playlist.id} className="relative overflow-hidden">
         <CardHeader>
           <CardTitle className="flex items-center justify-between">
             <span className="truncate">{playlist.name}</span>
             {playlist.is_custom && (
               <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                 Custom
               </span>
             )}
           </CardTitle>
         </CardHeader>
         <CardContent>
           <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4 text-sm">
               <div>
                 <p className="text-gray-500">Channels</p>
                 <p className="font-medium">{playlist.channels.length}</p>
               </div>
               <div>
                 <p className="text-gray-500">Last Sync</p>
                 <p className="font-medium">
                   {playlist.last_sync ? formatDate(playlist.last_sync) : 'Never'}
                 </p>
               </div>
             </div>

             <div className="flex justify-between space-x-2">
               <div className="flex space-x-2">
                 {playlist.url && (
                   <Button
                     size="sm"
                     variant="secondary"
                     onClick={() => handleSync(playlist.id)}
                     className="shrink-0"
                   >
                     <RefreshCcw className="mr-1 h-4 w-4" />
                     <span className="hidden sm:inline">Sync</span>
                   </Button>
                 )}
                 
                 {playlist.public_token && (
                   <Button
                     size="sm"
                     variant="secondary"
                     as="a"
                     href={getPublicPlaylistUrl(playlist.public_token)}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="shrink-0"
                   >
                     <ExternalLink className="mr-1 h-4 w-4" />
                     <span className="hidden sm:inline">M3U</span>
                   </Button>
                 )}
               </div>

               <div className="flex space-x-2">
                 <Link to={`/playlists/${playlist.id}`}>
                   <Button size="sm" variant="secondary" className="shrink-0">
                     <Edit className="mr-1 h-4 w-4" />
                     <span className="hidden sm:inline">Edit</span>
                   </Button>
                 </Link>
                 
                 <Button
                   size="sm"
                   variant="ghost"
                   onClick={() => handleDelete(playlist)}
                   className="shrink-0"
                 >
                   <Trash2 className="h-4 w-4 text-red-500" />
                 </Button>
               </div>
             </div>
           </div>
         </CardContent>
       </Card>
     ))}
   </div>
 );
}