// ChannelList.jsx
import React, { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ChannelCard } from './ChannelCard';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import { groupChannelsByGroup } from '@/lib/utils';

export function ChannelList({ 
  playlistId, 
  channels = [], 
  onEditChannel,
  showGroups = true 
}) {
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  
  const { updateChannelOrder } = useStore(state => ({
    updateChannelOrder: state.playlists.updateChannelOrder
  }));

  const groups = [...new Set(channels.map(ch => ch.group_title).filter(Boolean))];

  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = !groupFilter || channel.group_title === groupFilter;
    return matchesSearch && matchesGroup;
  });

  const groupedChannels = showGroups ? 
    groupChannelsByGroup(filteredChannels) : 
    { 'All': filteredChannels };

  const moveChannel = async (channelId, direction) => {
    const currentIndex = filteredChannels.findIndex(c => c.id === channelId);
    if ((direction === 'up' && currentIndex === 0) || 
        (direction === 'down' && currentIndex === filteredChannels.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const updatedChannels = [...filteredChannels];
    [updatedChannels[currentIndex], updatedChannels[newIndex]] = 
    [updatedChannels[newIndex], updatedChannels[currentIndex]];

    const channelOrders = updatedChannels.map((channel, index) => ({
      id: channel.id,
      position: index + 1
    }));

    await updateChannelOrder(playlistId, channelOrders);
  };

  if (channels.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No channels found</p>
        <Button 
          className="mt-4" 
          onClick={() => onEditChannel(null)}
        >
          Add Channel
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              placeholder="Search channels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {groups.length > 0 && (
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2"
          >
            <option value="">All Groups</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        )}
      </div>

      {Object.entries(groupedChannels).map(([group, groupChannels]) => (
        <div key={group} className="space-y-2">
          {showGroups && groupChannels.length > 0 && (
            <h3 className="font-semibold text-gray-900">{group}</h3>
          )}
          
          {groupChannels.map((channel) => (
            <div key={channel.id} className="flex items-center gap-2">
              <div className="flex flex-col">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveChannel(channel.id, 'up')}
                  className="p-1"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveChannel(channel.id, 'down')}
                  className="p-1"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <ChannelCard
                  channel={channel}
                  onEdit={() => onEditChannel(channel)}
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}