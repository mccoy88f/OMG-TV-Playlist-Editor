import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Menu, Plus, LogOut } from 'lucide-react';

export function Header() {
  const { user, logout, toggleSidebar } = useStore(state => ({
    user: state.auth.user,
    logout: state.auth.logout,
    toggleSidebar: state.ui.toggleSidebar
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center px-4">
        <button
          onClick={toggleSidebar}
          className="mr-4 rounded-md p-2 hover:bg-gray-100 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link to="/" className="mr-6 flex items-center space-x-2">
          <span className="hidden text-xl font-bold sm:inline-block">
            OMG Playlist Manager
          </span>
        </Link>

        <div className="ml-auto flex items-center space-x-4">
          <Link to="/playlists/add">
            <Button size="sm" variant="outline" className="hidden sm:flex">
              <Plus className="mr-2 h-4 w-4" />
              Add Playlist
            </Button>
          </Link>

          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">{user?.username}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}