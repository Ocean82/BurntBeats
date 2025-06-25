import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Bot, User, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface SassyAIChatProps {
  user?: any;
}

export default function SassyAIChat({ user }: SassyAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hey there, musical genius! 🎵 I'm your AI companion with attitude. Ready to roast your lyrics and help you make fire tracks? Drop me a line!",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai-chat", { 
        message,
        context: "music_creation",
        user: user?.username || "Anonymous"
      });
      return response.json();
    },
    onSuccess: (response) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: response.reply,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    },
    onError: (error) => {
      console.error('Chat error:', error);
      // Enhanced fallback responses based on different error scenarios
      const sassyResponses = [
        "Hmm, my circuits are having a moment. But I bet your lyrics need work anyway! 😏",
        "Error 404: Decent lyrics not found. Try harder next time!",
        "My AI brain is buffering... unlike your creativity which seems permanently stuck!",
        "Technical difficulties aside, I'm still more talented than your last song attempt.",
        "Connection lost, but my sass remains intact. Got any real music questions?",
        "I'm having technical difficulties, but honestly, your music probably needs more work than my code does.",
        "Server's down, but my attitude is still up! What else you got?",
        "My circuits are fried from trying to process your last message. Give me a sec to recover!"
      ];
      
      const randomResponse = sassyResponses[Math.floor(Math.random() * sassyResponses.length)];
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: randomResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    }
  });

  // Add quick suggestion buttons
  const quickSuggestions = [
    "Roast my lyrics",
    "Help with chords",
    "Random advice",
    "What's trending?"
  ];

  const handleQuickSuggestion = (suggestion: string) => {
    setInput(suggestion);
    const userMessage: Message = {
      id: Date.now().toString(),
      text: suggestion,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(suggestion);
    setInput("");
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(input);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="bg-dark-card border-gray-800 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium text-white flex items-center">
          <Bot className="w-5 h-5 mr-2 text-purple-400" />
          Sassy AI Assistant
          <Sparkles className="w-4 h-4 ml-2 text-yellow-400" />
        </CardTitle>
        <p className="text-sm text-gray-400">
          Your brutally honest AI companion for music creation
        </p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4 p-4">
        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-1 pr-4"
          style={{ maxHeight: '400px' }}
        >
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-100'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                
                {message.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-blue-400 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about music, lyrics, or just chat..."
            className="flex-1 bg-gray-800 border-gray-700 text-white"
            disabled={chatMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center mb-2">
          {quickSuggestions.map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              onClick={() => handleQuickSuggestion(suggestion)}
              className="text-xs bg-gray-800 border-gray-600 hover:bg-gray-700"
              disabled={chatMutation.isPending}
            >
              {suggestion}
            </Button>
          ))}
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          💡 Click a suggestion above or type your own message
        </div>
      </CardContent>
    </Card>
  );
}