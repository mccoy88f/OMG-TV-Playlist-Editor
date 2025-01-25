// ChannelForm.jsx ottimizzato
import React, { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Plus, X } from 'lucide-react';
import { isValidUrl } from '@/lib/utils';

export function ChannelForm({ 
 playlistId, 
 channel = null, 
 onSuccess, 
 onCancel 
}) {
 const { addChannel, updateChannel } = useStore(state => ({
   addChannel: state.playlists.addChannel,
   updateChannel: state.playlists.updateChannel
 }));

 const [errors, setErrors] = useState({});
 const [loading, setLoading] = useState(false);
 const [extraTags, setExtraTags] = useState(() => {
   if (channel?.extra_tags) {
     return Object.entries(channel.extra_tags).map(([key, value]) => ({ key, value }));
   }
   return [{ key: '', value: '' }];
 });

 const validateForm = useCallback((data) => {
   const errors = {};
   
   if (!data.name) {
     errors.name = 'Name is required';
   }

   if (!data.url) {
     errors.url = 'URL is required';
   } else if (!isValidUrl(data.url)) {
     errors.url = 'Invalid URL format';
   }

   if (data.logo_url && !isValidUrl(data.logo_url)) {
     errors.logo_url = 'Invalid logo URL format';
   }

   return errors;
 }, []);

 const handleSubmit = async (e) => {
   e.preventDefault();
   setLoading(true);
   setErrors({});

   const formData = new FormData(e.target);
   const data = {
     name: formData.get('name'),
     url: formData.get('url'),
     group_title: formData.get('group_title') || null,
     logo_url: formData.get('logo_url') || null,
     tvg_id: formData.get('tvg_id') || null,
     extra_tags: extraTags
       .filter(tag => tag.key && tag.value)
       .reduce((acc, { key, value }) => ({ ...acc, [key]: value }), {})
   };

   const validationErrors = validateForm(data);
   if (Object.keys(validationErrors).length > 0) {
     setErrors(validationErrors);
     setLoading(false);
     return;
   }

   try {
     if (channel) {
       await updateChannel(channel.id, data);
     } else {
       await addChannel(playlistId, data);
     }
     onSuccess?.();
   } catch (error) {
     setErrors({ submit: error.message });
   } finally {
     setLoading(false);
   }
 };

 const handleExtraTagChange = useCallback((index, field, value) => {
   setExtraTags(prev => {
     const newTags = [...prev];
     newTags[index] = { ...newTags[index], [field]: value };
     return newTags;
   });
 }, []);

 return (
   <Card>
     <CardHeader>
       <CardTitle>{channel ? 'Edit Channel' : 'Add Channel'}</CardTitle>
     </CardHeader>
     <CardContent>
       <form onSubmit={handleSubmit} className="space-y-6">
         {errors.submit && (
           <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
             {errors.submit}
           </div>
         )}

         <div className="grid gap-4 sm:grid-cols-2">
           <div className="space-y-2">
             <Input
               name="name"
               placeholder="Channel Name"
               defaultValue={channel?.name}
               error={errors.name}
               required
             />
           </div>
           
           <div className="space-y-2">
             <Input
               name="url"
               type="url"
               placeholder="Stream URL"
               defaultValue={channel?.url}
               error={errors.url}
               required
             />
           </div>
         </div>

         <div className="grid gap-4 sm:grid-cols-2">
           <div className="space-y-2">
             <Input
               name="group_title"
               placeholder="Group"
               defaultValue={channel?.group_title}
             />
           </div>
           
           <div className="space-y-2">
             <Input
               name="logo_url"
               type="url"
               placeholder="Logo URL"
               defaultValue={channel?.logo_url}
               error={errors.logo_url}
             />
           </div>
         </div>

         <div className="space-y-2">
           <Input
             name="tvg_id"
             placeholder="TVG ID"
             defaultValue={channel?.tvg_id}
           />
         </div>

         <div className="space-y-4">
           <div className="flex items-center justify-between">
             <span className="text-sm font-medium">Extra Tags</span>
             <Button
               type="button"
               variant="ghost"
               size="sm"
               onClick={() => setExtraTags(prev => [...prev, { key: '', value: '' }])}
             >
               <Plus className="mr-1 h-4 w-4" />
               Add Tag
             </Button>
           </div>

           {extraTags.map((tag, index) => (
             <div key={index} className="flex items-center gap-2">
               <Input
                 placeholder="Tag name"
                 value={tag.key}
                 onChange={(e) => handleExtraTagChange(index, 'key', e.target.value)}
               />
               <Input
                 placeholder="Tag value"
                 value={tag.value}
                 onChange={(e) => handleExtraTagChange(index, 'value', e.target.value)}
               />
               <Button
                 type="button"
                 variant="ghost"
                 size="sm"
                 onClick={() => setExtraTags(prev => prev.filter((_, i) => i !== index))}
               >
                 <X className="h-4 w-4" />
               </Button>
             </div>
           ))}
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
             {channel ? 'Save Changes' : 'Add Channel'}
           </Button>
         </div>
       </form>
     </CardContent>
   </Card>
 );
}