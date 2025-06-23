"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"

interface SongLibraryProps {
  userId: number
  onEditSong: (song: any) => void
}

export default function SongLibrary({ userId, onEditSong }: SongLibraryProps) {
  const [songs, setSongs] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterGenre, setFilterGenre] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  // Mock songs data
  useEffect(() => {
    const mockSongs = [
      {
        id: 1,
        title: "Digital Dreams",
        genre: "electronic",
        mood: "energetic",
        tempo: 128,
        duration: 180,
        createdAt: "2024-01-15",
        status: "completed",
        audioUrl: "/mock-song-1.mp3"
      },
      {
        id: 2,
        title: "Midnight Reflections",
        genre: "pop",
        mood: "melancholy",
        tempo: 95,
        duration: 210,
        createdAt: "2024-01-12",
        status: "completed",
        audioUrl: "/mock-song-2.mp3"
      },
      {
        id: 3,
        title: "Summer Vibes",
        genre: "reggae",
        mood: "happy",
        tempo: 110,
        duration: 195,
        createdAt: "2024-01-10",
        status: "completed",
        audioUrl: "/mock-song-3.mp3"
      }
    ]
    setSongs(mockSongs)
  }, [])

  const filteredSongs = songs.filter(song => {
    const matchesSearch = song.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = filterGenre === "all" || song.genre === filterGenre
    return matchesSearch && matchesGenre
  })

  const sortedSongs = [...filteredSongs].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case "title":
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="bg-white/5\
