import YouTubeSyncPanel from '../../components/admin/YouTubeSyncPanel'
import { useAuth } from '../../context/AuthContext'

const AdminYouTube = () => {
  const { user } = useAuth()
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary font-clash mb-6">
        YouTube Sync
      </h1>
      <YouTubeSyncPanel currentUserId={user?.id} />
    </div>
  )
}

export default AdminYouTube
