import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store';
import { Pencil, Trash2, Play, Tag } from 'lucide-react';

export function ChannelCard({ channel, onEdit }) {
 const { deleteChannel, showModal } = useStore(state => ({
   deleteChannel: state.playlists.deleteChannel,
   showModal: state.ui.showModal
 }));

 const handleDelete = () => {
   showModal({
     title: 'Delete Channel',
     children: (
       <div className="space-y-4">
         <p>Are you sure you want to delete "{channel.name}"?</p>
         <div className="flex justify-end space-x-2">
           <Button
             variant="ghost"
             onClick={() => showModal(null)}
           >
             Cancel
           </Button>
           <Button
             variant="destructive"
             onClick={async () => {
               await deleteChannel(channel.id);
               showModal(null);
             }}
           >
             Delete
           </Button>
         </div>
       </div>
     )
   });
 };

 return (
   <Card>
     <CardContent className="p-4">
       <div className="flex items-start justify-between gap-4">
         {channel.logo_url && (
           <img
             src={channel.logo_url}
             alt={`${channel.name} logo`}
             className="h-10 w-10 rounded-md object-cover"
             onError={(e) => e.target.style.display = 'none'}
           />
         )}

         <div className="flex-1 space-y-1 min-w-0">
           <h4 className="font-medium truncate">{channel.name}</h4>
           {channel.group_title && (
             <div className="flex items-center text-sm text-gray-500">
               <Tag className="mr-1 h-4 w-4 shrink-0" />
               <span className="truncate">{channel.group_title}</span>
             </div>
           )}
           {channel.tvg_id && (
             <div className="text-sm text-gray-500 truncate">
               TVG ID: {channel.tvg_id}
             </div>
           )}
         </div>

         <div className="flex space-x-2 shrink-0">
           <Button
             size="sm"
             variant="ghost"
             onClick={() => window.open(channel.url, '_blank')}
             title="Play"
           >
             <Play className="h-4 w-4" />
           </Button>
           <Button
             size="sm"
             variant="ghost"
             onClick={() => onEdit(channel)}
             title="Edit"
           >
             <Pencil className="h-4 w-4" />
           </Button>
           <Button
             size="sm"
             variant="ghost"
             onClick={handleDelete}
             title="Delete"
           >
             <Trash2 className="h-4 w-4 text-red-500" />
           </Button>
         </div>
       </div>
     </CardContent>
   </Card>
 );
}