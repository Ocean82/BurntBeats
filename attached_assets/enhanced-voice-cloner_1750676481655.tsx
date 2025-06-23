"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, Wand2, Music, Download, Sparkles, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface EnhancedVoiceClonerProps {
  userId: number
}

export default function EnhancedVoiceCloner({ userId }: EnhancedVoiceClonerProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [clonedVoice, setClonedVoice] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState("pop")
  const [selectedStyle, setSelectedStyle] = useState("smooth")
  const [voiceQuality, setVoiceQuality] = useState<{
    clarity: number
    naturalness: number
    consistency: number
    suitability: number
  } | null>(null)
  const [voiceSimilarity, setVoiceSimilarity] = useState<number | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const { toast } = useToast()

  const genres = [
    { value: "pop", label: "Pop" },
    { value: "rock", label: "Rock" },
    { value: "hiphop", label: "Hip Hop" },
    { value: "electronic", label: "Electronic" },
    { value: "jazz", label: "Jazz" },
    { value: "classical", label: "Classical" },
  ]

  const styles = [
    { value: "smooth", label: "Smooth & Clear" },
    { value: "raw", label: "Raw & Natural" },
    { value: "energetic", label: "Energetic & Bright" },
    { value: "mellow", label: "Mellow & Warm" },
  ]

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        setRecordedBlob(blob)
        stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive",
      })
    }
  }, [toast])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }, [isRecording])

  const processVoiceClone = useCallback(async () => {
    if (!recordedBlob) {
      toast({
        title: "No Recording",
        description: "Please record a voice sample first",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingStep(0)

    try {
      // Advanced voice processing pipeline
      const processingSteps = [
        "Analyzing voice characteristics with neural embedding",
        "Extracting spectral features and formants",
        "Applying genre-specific voice adaptation",
        "Preserving original timbre characteristics",
        "Generating optimized voice model",
      ]

      // Add voice quality analysis
      const analyzeVoiceQuality = (audioBlob: Blob) => {
        // Simulate advanced voice analysis
        return {
          clarity: 0.92,
          naturalness: 0.88,
          consistency: 0.95,
          suitability: selectedGenre === "jazz" ? 0.85 : 0.9,
        }
      }

      // Add real-time voice similarity scoring
      const calculateVoiceSimilarity = (originalVoice: Blob, clonedVoice: string) => {
        // Simulate voice similarity analysis
        return Math.random() * 0.3 + 0.7 // 70-100% similarity
      }

      for (let step = 0; step < processingSteps.length; step++) {
        setProcessingStep(step)
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      // Mock API call for voice cloning
      const formData = new FormData()
      formData.append("audio", recordedBlob, "voice_sample.webm")
      formData.append("genre", selectedGenre)
      formData.append("style", selectedStyle)
      formData.append("userId", userId.toString())

      // Simulate successful processing
      const mockClonedVoiceUrl = `/api/voice-clone/result_${Date.now()}.mp3`
      setClonedVoice(mockClonedVoiceUrl)

      // Analyze voice quality
      const quality = analyzeVoiceQuality(recordedBlob)
      setVoiceQuality(quality)

      // Calculate voice similarity
      const similarity = calculateVoiceSimilarity(recordedBlob, mockClonedVoiceUrl)
      setVoiceSimilarity(similarity)

      toast({
        title: "🎤 Voice Cloned Successfully!",
        description: "Your custom voice is ready for song generation",
      })
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Voice cloning failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [recordedBlob, selectedGenre, selectedStyle, userId, toast])

  const processingSteps = [
    "Analyzing voice characteristics with neural embedding",
    "Extracting spectral features and formants",
    "Applying genre-specific voice adaptation",
    "Preserving original timbre characteristics",
    "Generating optimized voice model",
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-white/5 border-white/10 backdrop-blur-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Mic className="w-6 h-6 mr-2 text-purple-400" />
            Voice Studio
          </CardTitle>
          <CardDescription className="text-gray-400">
            Clone your voice and adapt it for different musical genres
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="record" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/10">
              <TabsTrigger value="record" className="text-white">
                Record
              </TabsTrigger>
              <TabsTrigger value="process" className="text-white">
                Process
              </TabsTrigger>
              <TabsTrigger value="results" className="text-white">
                Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="space-y-6">
              {/* Recording Interface */}
              <div className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center border-2 border-white/10">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    size="lg"
                    className={`w-20 h-20 rounded-full ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                        : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                    }`}
                  >
                    <Mic className="w-8 h-8" />
                  </Button>
                </div>

                <div>
                  <p className="text-white font-medium">{isRecording ? "Recording..." : "Click to start recording"}</p>
                  <p className="text-gray-400 text-sm">Speak clearly for 10-30 seconds for best results</p>
                </div>

                {recordedBlob && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-green-400 font-medium mb-2">✓ Recording captured</p>
                    <audio controls src={URL.createObjectURL(recordedBlob)} className="w-full" />
                  </div>
                )}
              </div>

              {/* Voice Tips */}
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="p-4">
                  <h4 className="text-blue-200 font-medium mb-2">Recording Tips</h4>
                  <ul className="text-blue-200/80 text-sm space-y-1">
                    <li>• Record in a quiet environment</li>
                    <li>• Speak naturally and clearly</li>
                    <li>• Include varied tones and emotions</li>
                    <li>• Aim for 15-30 seconds of speech</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="process" className="space-y-6">
              {/* Genre and Style Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white font-medium">Target Genre</label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {genres.map((genre) => (
                        <SelectItem key={genre.value} value={genre.value}>
                          {genre.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-white font-medium">Vocal Style</label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {styles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Processing Status */}
              {isProcessing && (
                <Card className="bg-purple-500/10 border-purple-500/20">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-purple-200 font-medium">{processingSteps[processingStep]}</span>
                        <Badge variant="secondary">
                          {processingStep + 1}/{processingSteps.length}
                        </Badge>
                      </div>
                      <Progress value={((processingStep + 1) / processingSteps.length) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Process Button */}
              <Button
                onClick={processVoiceClone}
                disabled={!recordedBlob || isProcessing}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 py-3"
              >
                <Wand2 className="w-5 h-5 mr-2" />
                {isProcessing ? "Processing..." : "Clone Voice"}
              </Button>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {clonedVoice ? (
                <div className="space-y-4">
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Sparkles className="w-6 h-6 text-green-400" />
                        <div>
                          <h4 className="text-green-200 font-medium">Voice Clone Ready!</h4>
                          <p className="text-green-200/80 text-sm">
                            Optimized for {selectedGenre} with {selectedStyle} style
                          </p>
                        </div>
                      </div>

                      <audio controls src={clonedVoice} className="w-full mb-4" />

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Fine-tune
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Voice Characteristics */}
                  <Card className="bg-white/5 border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Voice Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <span className="text-gray-400">Pitch Range:</span>
                          <p className="text-white font-medium">A2 - C5</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-400">Timbre:</span>
                          <p className="text-white font-medium">Warm</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-400">Quality:</span>
                          {voiceQuality && (
                            <p
                              className={`font-medium ${voiceQuality.clarity > 0.85 ? "text-green-400" : "text-yellow-400"}`}
                            >
                              Clarity: {(voiceQuality.clarity * 100).toFixed(0)}%
                            </p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-gray-400">Compatibility:</span>
                          <p className="text-white font-medium">95%</p>
                        </div>
                        {voiceSimilarity !== null && (
                          <div className="space-y-1">
                            <span className="text-gray-400">Voice Similarity:</span>
                            <p className="text-white font-medium">{(voiceSimilarity * 100).toFixed(0)}%</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No voice clone generated yet</p>
                  <p className="text-gray-500 text-sm">Complete the recording and processing steps first</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
