// src/components/dashboard/sections/Settings/Settings.jsx
import SiteSettings from './SiteSettings';
import ShareAccess from './ShareAccess';

export default function Settings({ user, permissions, onSuccess }) {
  return (
    <div className="space-y-6">
      <ShareAccess user={user} permissions={permissions} onSuccess={onSuccess} />
      
      {permissions.isAdmin() && (
        <SiteSettings />
      )}
    </div>
  );
}