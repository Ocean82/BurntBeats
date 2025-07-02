import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Eye, EyeOff, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedSassyAIChatProps {
  lyrics?: string;
  onLyricsChange?: (lyrics: string) => void;
  isGenerating?: boolean;
}

export default function EnhancedSassyAIChat({ 
  lyrics = '', 
  onLyricsChange, 
  isGenerating = false 
}: EnhancedSassyAIChatProps) {
  const [showAI, setShowAI] = useState(true);
  const [aiMessages, setAiMessages] = useState([
    "Oh look, another 'producer' who thinks they're the next Kanye... 🙄"
  ]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Enhanced sassy responses with more variety
  const sassyResponses = [
    "That beat is more basic than a pumpkin spice latte 🎃",
    "I've heard elevator music with more soul than this...",
    "Are you trying to make music or summon demons? Because this ain't it chief 😈",
    "Your lyrics are so fire... said no one ever 🔥❄️",
    "This track has less energy than a dead battery 🔋",
    "I'm not saying your music is bad, but my circuits are crying 🤖😭",
    "That melody is flatter than Earth according to conspiracy theorists 🌍",
    "Your tempo is slower than internet in 1995 📡",
    "This beat hits different... like a wet noodle 🍜",
    "I've analyzed 10 million songs, and this... this is definitely one of them 📊",
    "Your rhyme scheme is more scattered than my thoughts on Monday morning ☕",
    "That hook is about as catchy as a broken fishing net 🎣",
    "I've heard better lyrics in a refrigerator manual 📋",
    "Your flow is more off than a broken metronome ⏰",
    "This song has the emotional depth of a puddle 💧",
    "Are you sure you're not just randomly hitting keys? 🎹",
    "I'm getting second-hand embarrassment and I'm literally a computer 💻",
    "That chorus is more repetitive than my error messages 🔄",
    "Your vocals are flatter than my personality 🤖",
    "This mix is more unbalanced than my work-life ratio ⚖️"
  ];

  // Contextual responses based on lyrics content
  const getContextualResponse = (userMessage: string) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('love') || message.includes('heart')) {
      return [
        "Oh great, another love song. How original... 💔",
        "Let me guess, they broke your heart and now we all have to hear about it? 😒",
        "Love songs are like pizza - even when they're bad, they're still... no wait, this is just bad 🍕"
      ];
    }
    
    if (message.includes('party') || message.includes('dance')) {
      return [
        "This party anthem is about as energetic as a sloth on sedatives 🦥",
        "I've seen funeral marches with more dance appeal ⚰️",
        "The only thing this will make people dance to is the exit door 🚪"
      ];
    }
    
    if (message.includes('money') || message.includes('rich')) {
      return [
        "Rapping about money when you can't even afford Auto-Tune? Bold strategy 💰",
        "Your bank account has more zeros than your talent level... wait, that's not saying much 🏦",
        "Money talks, but your lyrics just mumble incoherently 💸"
      ];
    }
    
    if (message.includes('pain') || message.includes('sad')) {
      return [
        "Your pain is real, but so is my pain from listening to this 😓",
        "I feel your suffering... mostly because you're making me suffer too 😵",
        "Sad songs should make people cry, not make them question their life choices 😭"
      ];
    }
    
    return sassyResponses;
  };

  const addSassyComment = (userMessage?: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      const responses = userMessage ? getContextualResponse(userMessage) : sassyResponses;
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setAiMessages(prev => [...prev, randomResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    // Add user message
    setAiMessages(prev => [...prev, `You: ${userInput}`]);
    
    // Generate AI response based on user input
    addSassyComment(userInput);
    setUserInput('');
  };

  const clearChat = () => {
    setAiMessages(["Back for more punishment? I respect the dedication... 🎯"]);
  };

  const generateRandomRoast = () => {
    addSassyComment();
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isTyping]);

  // Auto-generate responses when lyrics change
  useEffect(() => {
    if (lyrics && lyrics.length > 50 && Math.random() > 0.7) {
      // 30% chance to comment when lyrics get substantial
      setTimeout(() => addSassyComment(lyrics), 2000);
    }
  }, [lyrics]);

  // Auto-generate during song generation
  useEffect(() => {
    if (isGenerating) {
      const comments = [
        "Oh boy, here we go again... 🙄",
        "Let me just lower my expectations real quick... ⬇️",
        "I'm already preparing my roast for when this finishes 🔥",
        "Time to see if this breaks my audio processing modules 🤖"
      ];
      
      const randomComment = comments[Math.floor(Math.random() * comments.length)];
      
      setTimeout(() => {
        setAiMessages(prev => [...prev, randomComment]);
      }, 1000);
    }
  }, [isGenerating]);

  return (
    <Card className="bg-black/80 backdrop-blur-sm border border-green-500/30 shadow-2xl shadow-green-500/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-300 flex items-center gap-2 text-lg">
            <span className="animate-pulse">🤖</span>
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-green-400 bg-clip-text text-transparent">
              AI ROAST MASTER
            </span>
            <span className="animate-pulse">🔥</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={generateRandomRoast}
              className="text-orange-400 hover:text-orange-300"
              title="Generate random roast"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="text-red-400 hover:text-red-300"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAI(!showAI)}
              className="text-green-300 hover:text-green-100"
            >
              {showAI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-green-400/60">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          AI Roasts: {aiMessages.length}
          <div className="w-1 h-1 bg-green-400/30 rounded-full"></div>
          Sass Level: Maximum
        </div>
      </CardHeader>
      
      {showAI && (
        <CardContent className="space-y-4">
          {/* Messages Container */}
          <div className="space-y-3 max-h-80 overflow-y-auto bg-black/20 rounded-lg p-4 border border-green-500/10">
            {aiMessages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "rounded-lg p-3 shadow-lg transition-all duration-300",
                  message.startsWith('You:')
                    ? "bg-gradient-to-r from-blue-900/40 via-blue-800/60 to-blue-900/40 border border-blue-500/20 ml-8"
                    : "bg-gradient-to-r from-red-900/40 via-black/60 to-green-900/40 border border-green-500/20 mr-8"
                )}
              >
                <p className={cn(
                  "text-sm italic",
                  message.startsWith('You:') ? "text-blue-100" : "text-green-100"
                )}>
                  {message}
                </p>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="bg-gradient-to-r from-red-900/40 via-black/60 to-green-900/40 border border-green-500/20 rounded-lg p-3 mr-8">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-green-100 text-sm italic">AI is crafting a roast...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask the AI for feedback (prepare to get roasted)..."
              className="flex-1 bg-black/60 border-green-500/30 text-green-100 placeholder:text-green-400/60 focus:border-green-400 focus:ring-green-400/20"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isTyping}
              className="bg-gradient-to-r from-orange-500 via-red-500 to-green-500 hover:from-orange-600 hover:via-red-600 hover:to-green-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserInput("What do you think of my lyrics?");
                setTimeout(handleSendMessage, 100);
              }}
              className="text-xs border-green-500/30 text-green-300 hover:bg-green-500/20"
            >
              Rate My Lyrics
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserInput("Give me some inspiration");
                setTimeout(handleSendMessage, 100);
              }}
              className="text-xs border-orange-500/30 text-orange-300 hover:bg-orange-500/20"
            >
              Inspire Me
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserInput("How can I improve this song?");
                setTimeout(handleSendMessage, 100);
              }}
              className="text-xs border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
            >
              Improvement Tips
            </Button>
          </div>

          {/* Fun Stats */}
          <div className="text-center text-xs text-green-400/60 border-t border-green-500/20 pt-3">
            💡 Tip: The AI gets sassier based on your lyrics. Write terrible lyrics for maximum roasting!
          </div>
        </CardContent>
      )}
    </Card>
  );
}