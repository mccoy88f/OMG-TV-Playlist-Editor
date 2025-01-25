import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout';
import { AuthGuard, RequireAuth } from '@/components/auth';
import { LoginPage } from '@/pages/Login';
import { HomePage } from '@/pages/Home';
import { PlaylistList } from '@/components/playlist/PlaylistList';
import { PlaylistDetailsPage } from '@/pages/PlaylistDetail';
import { AddPlaylistPage } from '@/pages/AddPlaylist';

export default function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<RequireAuth><Layout /></RequireAuth>}>
            <Route index element={<Navigate to="/playlists" />} />
            <Route path="/playlists" element={<HomePage />} /> {/* Modificato */}
            <Route path="/playlists/add" element={<AddPlaylistPage />} />
            <Route path="/playlists/:id" element={<PlaylistDetailsPage />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  );
}