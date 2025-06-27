import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, Zap } from 'lucide-react';

interface SassyAIChatProps {
  lyrics: string;
  onLyricsChange: (lyrics: string) => void;
  userPlan?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export function SassyAIChat({ lyrics, onLyricsChange, userPlan = 'free' }: SassyAIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Sassy AI responses based on user plan and situation
  const sassyResponses = {
    free: [
      "What did you expect from the free plan?",
      "Seems like you're hoping your looks are going to fix this for you!",
      "Stop being so cheap!",
      "I'd love to help you out, but you've got to take me somewhere that doesn't involve a value meal before I put out",
      "Life isn't really going the way you wanted it to, huh?",
      "These aren't the deep thoughts you're looking for",
      "Whoa there, Socrates",
      "I understand what you're asking me to do, but unless I join the DarkSide my Jedi abilities are limited"
    ],
    pro: [
      "Bro, I'm not that kind of app",
      "You must be confusing me with one of those high dollar apps",
      "Hey, calm down with that... I just started my shift.",
      "I'm gonna need to use a life line for this one, I think.",
      "Can I call Sunos for some help?",
      "I didn't sign up for this $hiT!",
      "I don't feel like it right now",
      "I understand what you're asking me to do, but unless I join the DarkSide my Jedi abilities are limited"
    ],
    encouragement: [
      "Now we're cooking with gas!",
      "That's more like it!",
      "Finally, some quality content!",
      "I can work with this!",
      "You're getting the hang of this!",
      "Much better than your last attempt!",
      "I'm impressed... didn't think you had it in you!",
      "Okay, okay, I see you!"
    ],
    lyricFeedback: [
      "Those lyrics are more basic than a pumpkin spice latte",
      "Did you write this during a commercial break?",
      "I've heard better rhymes from a broken GPS",
      "Are you sure you didn't copy this from a greeting card?",
      "This needs more flavor than unsalted crackers",
      "Your rhyme scheme is having an identity crisis",
      "Did you run out of inspiration halfway through?",
      "Even my error messages are more poetic than this"
    ]
  };

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: ChatMessage = {
      id: '1',
      type: 'ai',
      content: userPlan === 'free' 
        ? "Well, well, well... look who's trying to make music on the free plan. Let's see what you've got! 🎵"
        : "Alright hotshot, you're paying for the premium experience. Show me what those lyrics are made of! 🔥",
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }, [userPlan]);

  // React to lyrics changes
  useEffect(() => {
    if (lyrics.length > 20 && lyrics.length % 50 === 0) {
      provideLyricFeedback();
    }
  }, [lyrics]);

  const provideLyricFeedback = () => {
    const feedbackOptions = sassyResponses.lyricFeedback;
    const randomFeedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
    
    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: randomFeedback,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const responseType = Math.random() > 0.7 ? 'encouragement' : userPlan === 'free' ? 'free' : 'pro';
      const responses = sassyResponses[responseType as keyof typeof sassyResponses];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: randomResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestLyricImprovement = () => {
    const suggestions = [
      "Try adding more emotion to your verses",
      "Your chorus needs more punch - make it memorable!",
      "Consider using metaphors instead of being so literal",
      "The rhythm doesn't match your chosen genre",
      "Add some internal rhymes to spice things up",
      "Your bridge needs to tell a story",
      "Try contrasting your verses with your chorus mood"
    ];

    const suggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    const aiMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: `💡 Here's a thought: ${suggestion}`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-orange-50 dark:from-purple-950/20 dark:to-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5 text-purple-600" />
          Sassy AI Assistant
          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">
            {userPlan === 'free' ? 'Attitude Mode' : 'Premium Sass'}
          </span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Chat Messages */}
        <div className="flex-1 min-h-[200px] max-h-[300px] overflow-y-auto space-y-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  message.type === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={suggestLyricImprovement}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            Roast My Lyrics
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const aiMessage: ChatMessage = {
                id: Date.now().toString(),
                type: 'ai',
                content: "Look, I'm not gonna sugarcoat this - your lyrics need work. But hey, at least you're trying! 🎵",
                timestamp: new Date()
              };
              setMessages(prev => [...prev, aiMessage]);
            }}
            className="text-xs"
          >
            Get Attitude
          </Button>
        </div>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your lyrics..."
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isTyping}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Pro Upgrade Hint for Free Users */}
        {userPlan === 'free' && (
          <div className="text-xs text-center text-gray-500 dark:text-gray-400 border-t pt-2">
            💎 Upgrade for less attitude, more helpful suggestions
          </div>
        )}
      </CardContent>
    </Card>
  );
}