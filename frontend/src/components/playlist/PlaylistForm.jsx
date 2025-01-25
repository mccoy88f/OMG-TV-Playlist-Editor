import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VALIDATION_RULES } from '@/lib/constants';
import { isValidUrl } from '@/lib/utils';

export function PlaylistForm({ playlist = null, onSuccess, onCancel }) {
 const navigate = useNavigate();
 const { createPlaylist, updatePlaylist } = useStore(state => ({
   createPlaylist: state.playlists.createPlaylist,
   updatePlaylist: state.playlists.updatePlaylist
 }));

 const [errors, setErrors] = useState({});
 const [loading, setLoading] = useState(false);

 const validateForm = (data) => {
   const newErrors = {};
   
   if (!data.name || data.name.length < VALIDATION_RULES.NAME.minLength.value) {
     newErrors.name = VALIDATION_RULES.NAME.minLength.message;
   }

   if (data.url && !isValidUrl(data.url)) {
     newErrors.url = VALIDATION_RULES.URL.message;
   }

   if (data.epg_url && !isValidUrl(data.epg_url)) {
     newErrors.epg_url = VALIDATION_RULES.URL.message;
   }

   return newErrors;
 };

 const handleSubmit = async (e) => {
   e.preventDefault();
   setLoading(true);
   const formData = new FormData(e.target);
   
   const data = {
     name: formData.get('name'),
     url: formData.get('url') || null,
     epg_url: formData.get('epg_url') || null,
     is_custom: formData.get('is_custom') === 'true'
   };

   const formErrors = validateForm(data);
   if (Object.keys(formErrors).length > 0) {
     setErrors(formErrors);
     setLoading(false);
     return;
   }

   try {
     if (playlist) {
       await updatePlaylist(playlist.id, data);
     } else {
       const newPlaylist = await createPlaylist(data);
       navigate(`/playlists/${newPlaylist.id}`);
     }
     onSuccess?.();
   } catch (error) {
     setErrors({ submit: error.message });
   } finally {
     setLoading(false);
   }
 };

 return (
   <Card>
     <CardHeader>
       <CardTitle>
         {playlist ? 'Edit Playlist' : 'Create New Playlist'}
       </CardTitle>
     </CardHeader>
     <CardContent>
       <form onSubmit={handleSubmit} className="space-y-6">
         {errors.submit && (
           <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
             {errors.submit}
           </div>
         )}

         <div className="space-y-2">
           <label htmlFor="name" className="text-sm font-medium text-gray-700">
             Name
           </label>
           <Input
             id="name"
             name="name"
             defaultValue={playlist?.name}
             error={errors.name}
             required
           />
         </div>

         <div className="space-y-2">
           <label htmlFor="url" className="text-sm font-medium text-gray-700">
             M3U URL (optional)
           </label>
           <Input
             id="url"
             name="url"
             type="url"
             defaultValue={playlist?.url}
             error={errors.url}
             placeholder="https://example.com/playlist.m3u"
           />
         </div>

         <div className="space-y-2">
           <label htmlFor="epg_url" className="text-sm font-medium text-gray-700">
             EPG URL (optional)
           </label>
           <Input
             id="epg_url"
             name="epg_url"
             type="url"
             defaultValue={playlist?.epg_url}
             error={errors.epg_url}
             placeholder="https://example.com/epg.xml"
           />
         </div>

         <div className="space-y-2">
           <label className="flex items-center space-x-2">
             <input
               type="checkbox"
               name="is_custom"
               value="true"
               defaultChecked={playlist?.is_custom}
               className="h-4 w-4 rounded border-gray-300 text-blue-600"
             />
             <span className="text-sm font-medium text-gray-700">
               Custom Playlist
             </span>
           </label>
         </div>

         <div className="flex justify-end space-x-2">
           <Button
             type="button"
             variant="ghost"
             onClick={onCancel}
             disabled={loading}
           >
             Cancel
           </Button>
           <Button type="submit" loading={loading} disabled={loading}>
             {playlist ? 'Save Changes' : 'Create Playlist'}
           </Button>
         </div>
       </form>
     </CardContent>
   </Card>
 );
}