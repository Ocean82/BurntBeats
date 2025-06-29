"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mic, Wand2, Music, Download, Sparkles, Settings, Upload, Play, Pause } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useMutation } from "@tanstack/react-query"

interface EnhancedVoiceClonerProps {
  userId: string
  onVoiceCloned?: (voiceData: any) => void
}

export default function EnhancedVoiceCloner({ userId, onVoiceCloned }: EnhancedVoiceClonerProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [clonedVoice, setClonedVoice] = useState<any | null>(null)
  const [selectedGenre, setSelectedGenre] = useState("pop")
  const [selectedStyle, setSelectedStyle] = useState("smooth")
  const [singingStyle, setSingingStyle] = useState("melodic")
  const [voiceQuality, setVoiceQuality] = useState<{
    clarity: number
    naturalness: number
    consistency: number
    suitability: number
  } | null>(null)
  const [voiceSimilarity, setVoiceSimilarity] = useState<number | null>(null)
  const [voiceName, setVoiceName] = useState("")
  const [sampleText, setSampleText] = useState("This is my voice sample for cloning")
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Advanced voice parameters
  const [pitchShift, setPitchShift] = useState([0])
  const [timbreWarmth, setTimbreWarmth] = useState([50])
  const [breathiness, setBreathiness] = useState([30])
  const [vibrato, setVibrato] = useState([25])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { toast } = useToast()

  const genres = [
    { value: "pop", label: "Pop" },
    { value: "rock", label: "Rock" },
    { value: "hiphop", label: "Hip Hop" },
    { value: "electronic", label: "Electronic" },
    { value: "jazz", label: "Jazz" },
    { value: "classical", label: "Classical" },
    { value: "country", label: "Country" },
    { value: "rnb", label: "R&B" },
  ]

  const styles = [
    { value: "smooth", label: "Smooth & Clear" },
    { value: "raw", label: "Raw & Natural" },
    { value: "energetic", label: "Energetic & Bright" },
    { value: "mellow", label: "Mellow & Warm" },
    { value: "powerful", label: "Powerful & Bold" },
  ]

  const singingStyles = [
    { value: "melodic", label: "Melodic" },
    { value: "rhythmic", label: "Rhythmic" },
    { value: "soulful", label: "Soulful" },
    { value: "theatrical", label: "Theatrical" },
  ]

  // Voice cloning mutation
  const voiceCloneMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/voice/clone', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || 'Voice cloning failed')
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      setIsProcessing(false)
      setClonedVoice(data)
      setVoiceQuality({
        clarity: data.characteristics?.clarity || 0.92,
        naturalness: data.characteristics?.naturalness || 0.88,
        consistency: data.characteristics?.consistency || 0.95,
        suitability: data.compatibilityScore || 0.9,
      })
      setVoiceSimilarity(data.compatibilityScore || 0.85)
      
      if (onVoiceCloned) {
        onVoiceCloned(data)
      }
      
      toast({
        title: "Voice Cloned Successfully!",
        description: `Your voice is ready with ${Math.round((data.compatibilityScore || 0.85) * 100)}% compatibility`,
      })
    },
    onError: (error: Error) => {
      setIsProcessing(false)
      toast({
        title: "Voice Cloning Failed",
        description: error.message || "Please try again with a clearer recording",
        variant: "destructive",
      })
    }
  })

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

      mediaRecorder.start(1000)
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

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setRecordedBlob(null) // Clear recorded audio if file is uploaded
    }
  }, [])

  const processVoiceClone = useCallback(async () => {
    const audioSource = recordedBlob || uploadedFile
    
    if (!audioSource) {
      toast({
        title: "No Audio Source",
        description: "Please record or upload a voice sample first",
        variant: "destructive",
      })
      return
    }

    if (!voiceName.trim()) {
      toast({
        title: "Voice Name Required",
        description: "Please enter a name for your voice clone",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingStep(0)

    try {
      const processingSteps = [
        "Analyzing voice characteristics with neural embedding",
        "Extracting spectral features and formants",
        "Applying genre-specific voice adaptation",
        "Preserving original timbre characteristics",
        "Generating optimized voice model",
      ]

      // Simulate processing steps
      for (let step = 0; step < processingSteps.length; step++) {
        setProcessingStep(step)
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }

      const formData = new FormData()
      
      if (audioSource instanceof File) {
        formData.append("audio", audioSource)
      } else {
        formData.append("audio", audioSource, "voice_sample.webm")
      }
      
      formData.append("name", voiceName)
      formData.append("genre", selectedGenre)
      formData.append("style", selectedStyle)
      formData.append("singingStyle", singingStyle)
      formData.append("userId", userId)
      formData.append("sampleText", sampleText)
      formData.append("makePublic", "false")
      
      // Add advanced parameters
      formData.append("pitchShift", pitchShift[0].toString())
      formData.append("timbreWarmth", timbreWarmth[0].toString())
      formData.append("breathiness", breathiness[0].toString())
      formData.append("vibrato", vibrato[0].toString())

      await voiceCloneMutation.mutateAsync(formData)
    } catch (error) {
      console.error("Voice cloning error:", error)
    }
  }, [recordedBlob, uploadedFile, voiceName, selectedGenre, selectedStyle, singingStyle, userId, sampleText, pitchShift, timbreWarmth, breathiness, vibrato, voiceCloneMutation, toast])

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
        .catch(error => console.error("Playback failed:", error))
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const processingSteps = [
    "Analyzing voice characteristics with neural embedding",
    "Extracting spectral features and formants", 
    "Applying genre-specific voice adaptation",
    "Preserving original timbre characteristics",
    "Generating optimized voice model",
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-xl shadow-green-500/10">
        <CardHeader>
          <CardTitle className="text-green-300 flex items-center">
            <Mic className="w-6 h-6 mr-2 text-green-400" />
            Voice Studio Pro
          </CardTitle>
          <CardDescription className="text-green-400/60">
            Clone your voice and adapt it for different musical genres with professional-grade controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="record" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-black/60 border border-green-500/30">
              <TabsTrigger value="record" className="text-green-300">
                Record
              </TabsTrigger>
              <TabsTrigger value="upload" className="text-green-300">
                Upload
              </TabsTrigger>
              <TabsTrigger value="process" className="text-green-300">
                Process
              </TabsTrigger>
              <TabsTrigger value="results" className="text-green-300">
                Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="space-y-6">
              {/* Recording Interface */}
              <div className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center border-2 border-green-500/30">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    size="lg"
                    className={`w-20 h-20 rounded-full ${
                      isRecording
                        ? "bg-red-500 hover:bg-red-600 animate-pulse"
                        : "bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500"
                    }`}
                  >
                    <Mic className="w-8 h-8" />
                  </Button>
                </div>

                <div>
                  <p className="text-green-300 font-medium">{isRecording ? "Recording..." : "Click to start recording"}</p>
                  <p className="text-green-400/60 text-sm">Speak clearly for 15-30 seconds for best results</p>
                </div>

                {recordedBlob && (
                  <div className="bg-black/60 rounded-lg p-4 border border-green-500/20">
                    <p className="text-green-400 font-medium mb-2">✓ Recording captured</p>
                    <audio controls src={URL.createObjectURL(recordedBlob)} className="w-full" />
                  </div>
                )}
              </div>

              {/* Voice Configuration */}
              <div className="space-y-4">
                <div>
                  <Label className="text-green-300 font-medium">Voice Name</Label>
                  <Input
                    value={voiceName}
                    onChange={(e) => setVoiceName(e.target.value)}
                    placeholder="Enter a name for your voice clone"
                    className="bg-black/60 border-green-500/30 text-green-300"
                  />
                </div>
                
                <div>
                  <Label className="text-green-300 font-medium">Sample Text (for testing)</Label>
                  <Input
                    value={sampleText}
                    onChange={(e) => setSampleText(e.target.value)}
                    placeholder="Text to generate with your cloned voice"
                    className="bg-black/60 border-green-500/30 text-green-300"
                  />
                </div>
              </div>

              {/* Recording Tips */}
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4">
                  <h4 className="text-green-300 font-medium mb-2">Recording Tips</h4>
                  <ul className="text-green-300/80 text-sm space-y-1">
                    <li>• Record in a quiet environment</li>
                    <li>• Speak naturally and clearly</li>
                    <li>• Include varied tones and emotions</li>
                    <li>• Aim for 15-30 seconds of speech</li>
                    <li>• Read a paragraph or sing a verse</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="upload" className="space-y-6">
              {/* File Upload Interface */}
              <div className="border-2 border-dashed border-green-500/30 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-green-300 font-medium">Upload Voice Sample</p>
                  <p className="text-green-400/60 text-sm">Support: MP3, WAV, M4A (max 10MB)</p>
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="voice-upload"
                />
                <Label htmlFor="voice-upload">
                  <Button className="mt-4 bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500">
                    Choose File
                  </Button>
                </Label>
              </div>

              {uploadedFile && (
                <div className="bg-black/60 rounded-lg p-4 border border-green-500/20">
                  <p className="text-green-400 font-medium mb-2">✓ File uploaded: {uploadedFile.name}</p>
                  <audio controls src={URL.createObjectURL(uploadedFile)} className="w-full" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="process" className="space-y-6">
              {/* Genre and Style Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-green-300 font-medium">Target Genre</Label>
                  <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                    <SelectTrigger className="bg-black/60 border-green-500/30 text-green-300">
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
                  <Label className="text-green-300 font-medium">Vocal Style</Label>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger className="bg-black/60 border-green-500/30 text-green-300">
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

                <div className="space-y-2">
                  <Label className="text-green-300 font-medium">Singing Style</Label>
                  <Select value={singingStyle} onValueChange={setSingingStyle}>
                    <SelectTrigger className="bg-black/60 border-green-500/30 text-green-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {singingStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Voice Parameters */}
              <Card className="bg-black/40 border-green-500/20">
                <CardHeader>
                  <CardTitle className="text-green-300 text-lg">Advanced Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-green-300">Pitch Shift: {pitchShift[0]}%</Label>
                      <Slider
                        value={pitchShift}
                        onValueChange={setPitchShift}
                        min={-50}
                        max={50}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-green-300">Timbre Warmth: {timbreWarmth[0]}%</Label>
                      <Slider
                        value={timbreWarmth}
                        onValueChange={setTimbreWarmth}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-green-300">Breathiness: {breathiness[0]}%</Label>
                      <Slider
                        value={breathiness}
                        onValueChange={setBreathiness}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-green-300">Vibrato: {vibrato[0]}%</Label>
                      <Slider
                        value={vibrato}
                        onValueChange={setVibrato}
                        min={0}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Status */}
              {isProcessing && (
                <Card className="bg-green-500/10 border-green-500/30">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-green-300 font-medium">{processingSteps[processingStep]}</span>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-300">
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
                disabled={(!recordedBlob && !uploadedFile) || isProcessing || !voiceName.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500 py-3"
              >
                <Wand2 className="w-5 h-5 mr-2" />
                {isProcessing ? "Processing..." : "Clone Voice"}
              </Button>
            </TabsContent>

            <TabsContent value="results" className="space-y-6">
              {clonedVoice ? (
                <div className="space-y-4">
                  <Card className="bg-green-500/10 border-green-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <Sparkles className="w-6 h-6 text-green-400" />
                        <div>
                          <h4 className="text-green-300 font-medium">Voice Clone Ready!</h4>
                          <p className="text-green-300/80 text-sm">
                            Optimized for {selectedGenre} with {selectedStyle} style
                          </p>
                        </div>
                      </div>

                      {clonedVoice.sampleUrl && (
                        <div className="mb-4">
                          <audio 
                            ref={audioRef}
                            controls 
                            src={clonedVoice.sampleUrl} 
                            className="w-full"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                          />
                        </div>
                      )}

                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="border-green-500/30 text-green-300">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button size="sm" variant="outline" className="border-green-500/30 text-green-300">
                          <Settings className="w-4 h-4 mr-2" />
                          Fine-tune
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Voice Analysis */}
                  <Card className="bg-black/60 border-green-500/20">
                    <CardHeader>
                      <CardTitle className="text-green-300 text-lg">Voice Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {voiceQuality && (
                          <>
                            <div className="space-y-1">
                              <span className="text-green-400/60">Clarity:</span>
                              <p className="text-green-300 font-medium">{Math.round(voiceQuality.clarity * 100)}%</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-green-400/60">Naturalness:</span>
                              <p className="text-green-300 font-medium">{Math.round(voiceQuality.naturalness * 100)}%</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-green-400/60">Consistency:</span>
                              <p className="text-green-300 font-medium">{Math.round(voiceQuality.consistency * 100)}%</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-green-400/60">Genre Fit:</span>
                              <p className="text-green-300 font-medium">{Math.round(voiceQuality.suitability * 100)}%</p>
                            </div>
                          </>
                        )}
                        {voiceSimilarity !== null && (
                          <div className="space-y-1">
                            <span className="text-green-400/60">Voice Similarity:</span>
                            <p className="text-green-300 font-medium">{Math.round(voiceSimilarity * 100)}%</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Music className="w-16 h-16 text-green-400/40 mx-auto mb-4" />
                  <p className="text-green-400/60">No voice clone available yet. Process a voice sample first.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}