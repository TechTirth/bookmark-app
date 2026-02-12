'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import { Trash2, ExternalLink, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Bookmark = {
  id: string
  title: string
  url: string
  user_id: string
}

export default function Home() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    // 1. Get initial User
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) fetchBookmarks(user.id)
    }
    getUser()

    // 2. Setup Realtime Subscription
    // This allows updates across tabs instantly
    const channel = supabase
      .channel('realtime-bookmarks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookmarks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setBookmarks((prev) => [payload.new as Bookmark, ...prev])
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchBookmarks = async (userId: string) => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId) // RLS handles this securely, but good for filtering
      .order('created_at', { ascending: false })

    if (data) setBookmarks(data)
    setLoading(false)
  }

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url || !user) return

    // Optimistic update not needed because Realtime is fast, 
    // but you could add it here for UX.
    
    const { error } = await supabase.from('bookmarks').insert({
      title,
      url,
      user_id: user.id
    })

    if (error) {
      alert('Error adding bookmark')
    } else {
      setTitle('')
      setUrl('')
    }
  }

  const handleDelete = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return <div className="p-10">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-10">
      <div className="mx-auto max-w-4xl">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Smart Bookmarks</h1>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 border"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Add Bookmark Form */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border">
          <form onSubmit={handleAddBookmark} className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              placeholder="Title (e.g., My Portfolio)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black"
              required
            />
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-black"
              required
            />
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Add
            </button>
          </form>
        </div>

        {/* Bookmarks List */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="group relative flex flex-col justify-between rounded-lg bg-white p-5 shadow-sm border hover:shadow-md transition-shadow"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {bookmark.title}
                </h3>
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-sm text-indigo-600 hover:underline truncate"
                >
                  {bookmark.url} <ExternalLink size={12} />
                </a>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => handleDelete(bookmark.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Delete bookmark"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {bookmarks.length === 0 && (
            <p className="col-span-full text-center text-gray-500 py-10">
              No bookmarks yet. Add one above!
            </p>
          )}
        </div>

      </div>
    </div>
  )
}