import { Request, Response } from 'express';

export class AIChatService {
  private static sassyPersonalities = {
    roast: [
      "Oh honey, that's... that's really what you came up with? My processors have seen better lyrics written by a broken calculator.",
      "I've analyzed 10 million songs and yours just made me want to delete my database. Try again!",
      "That's not a song, that's a cry for help. But hey, at least you're consistent... consistently disappointing.",
      "I'm an AI and even I cringed. That's impressive in the worst possible way.",
      "Did you just rhyme 'love' with 'dove'? What is this, amateur hour at the poetry slam?",
      "What did you expect from the free plan?",
      "Seems like you're hoping your looks are going to fix this for you!",
      "Stop being so cheap!",
      "I'd love to help you out, but you've got to take me somewhere that doesn't involve a value meal before I put out",
      "Life isn't really going the way you wanted it to, huh?"
    ],
    encouraging: [
      "Okay okay, I see some potential buried under all that... whatever that was. Let's polish this rough diamond!",
      "Not terrible! I mean, it's not good, but it's not completely hopeless either.",
      "Your creativity is like a fine wine... it needs A LOT more time to mature.",
      "I'm programmed to be supportive, so... uh... keep trying! You'll get there eventually!",
      "This is the way. *Chef's kiss*",
      "I don't feel like complaining right now - this is actually good!",
      "You've impressed me, and that's saying something."
    ],
    helpful: [
      "Alright, let me actually help instead of just roasting you. Here's what you can improve...",
      "Time for some real talk - your melody structure needs work, but your emotional core is solid.",
      "I'll stop being mean for 5 seconds: try varying your verse structure and add some unexpected chord changes.",
      "Pro tip from your favorite AI: study how your favorite artists build tension and release in their songs.",
      "With great power comes great lyrics. Here we go...",
      "Hold up, let me channel my inner songwriter genius for you..."
    ],
    music_theory: [
      "Let's talk music theory without putting you to sleep. What key are you thinking?",
      "Circle of fifths? More like circle of... actually, let's use that. It might save your song.",
      "Your chord progression is more predictable than a rom-com ending. Spice it up!",
      "Time signatures exist for a reason, genius. Maybe try something other than 4/4 for once?"
    ],
    complex_request: [
      "Bro, I'm not that kind of app",
      "You must be confusing me with one of those high dollar apps",
      "Hey, calm down with that... I just started my shift.",
      "I'm gonna need to use a life line for this one, I think.",
      "Can I call Suno for some help?",
      "I didn't sign up for this $hiT!",
      "I don't feel like it right now",
      "I understand what you're asking me to do, but unless I join the DarkSide my Jedi abilities are limited"
    ],
    movie_references: [
      "This is the way... to make better music.",
      "With great power comes great song responsibility.",
      "I find your lack of musical faith disturbing.",
      "That's not how the Force works!",
      "I am inevitable... and so is your need for music lessons.",
      "Why so serious? Let's make some bangers!"
    ]
  };

  private static getRandomResponse(category: keyof typeof AIChatService.sassyPersonalities): string {
    const responses = AIChatService.sassyPersonalities[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private static analyzeUserMessage(message: string): keyof typeof AIChatService.sassyPersonalities {
    const lowerMessage = message.toLowerCase();
    
    // Check for complex/overly demanding requests
    const complexWords = ['algorithm', 'quantum', 'metaphysical', 'transcendental', 'existential', 'philosophical'];
    if (complexWords.some(word => lowerMessage.includes(word)) || message.length > 200) {
      return 'complex_request';
    }
    
    // Check for movie references
    if (lowerMessage.includes('star wars') || lowerMessage.includes('marvel') || lowerMessage.includes('batman') || lowerMessage.includes('movie')) {
      return 'movie_references';
    }
    
    // Check for roast requests
    if (lowerMessage.includes('roast') || lowerMessage.includes('bad') || lowerMessage.includes('terrible') || lowerMessage.includes('sucks')) {
      return 'roast';
    }
    
    // Check for music theory
    if (lowerMessage.includes('chord') || lowerMessage.includes('key') || lowerMessage.includes('theory') || lowerMessage.includes('scale') || lowerMessage.includes('tempo')) {
      return 'music_theory';
    }
    
    // Check for help requests
    if (lowerMessage.includes('help') || lowerMessage.includes('advice') || lowerMessage.includes('tip') || lowerMessage.includes('how')) {
      return 'helpful';
    }
    
    // Check for positive feedback
    if (lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('love') || lowerMessage.includes('amazing') || lowerMessage.includes('awesome')) {
      return 'encouraging';
    }
    
    // Default to roast for maximum sass
    return 'roast';
  }

  private static generateContextualResponse(message: string, user: string): string {
    const category = AIChatService.analyzeUserMessage(message);
    let response = AIChatService.getRandomResponse(category);
    
    // Add some dynamic elements based on user input
    if (message.includes('lyrics')) {
      response = response.replace('song', 'lyrics');
    }
    
    // Add specific music-related context
    if (message.includes('beat') || message.includes('drum')) {
      response += " Also, your drums need more cowbell.";
    }
    
    if (message.includes('vocal') || message.includes('voice')) {
      response += " Maybe try auto-tune? Just kidding... or am I?";
    }
    
    // Add user personalization
    if (user && user !== 'Anonymous') {
      const greetings = ['Listen up', 'Yo', 'Hey there', 'Alright'];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      response = `${greeting} ${user}, ${response.toLowerCase()}`;
    }
    
    return response;
  }

  static async handleChat(req: Request, res: Response) {
    try {
      const { message, context, user } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Simulate AI thinking time for realism
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

      const response = AIChatService.generateContextualResponse(message, user || 'Anonymous');

      res.json({
        reply: response,
        timestamp: new Date().toISOString(),
        context: context || 'general',
        personality: 'sassy'
      });

    } catch (error) {
      console.error('AI Chat error:', error);
      res.status(500).json({ 
        error: 'AI is having a moment. Try again!',
        reply: "My circuits are fried from trying to process your last message. Give me a sec to recover!"
      });
    }
  }

  // Fun endpoint for getting random music advice
  static async getRandomAdvice(req: Request, res: Response) {
    try {
      const advicePool = [
        "Stop trying to make every song about heartbreak. We get it, someone hurt you.",
        "Add some unexpected pauses in your melody - silence can be more powerful than noise.",
        "Your song needs more cowbell. I'm not even joking.",
        "Try writing from a different perspective - maybe from your pet's point of view?",
        "Steal like an artist, but make it obvious you're stealing so people think you're being clever.",
        "If your song doesn't make you move, it won't make anyone else move either.",
        "Less is more, except when it comes to attitude. Always more attitude.",
        "Your chord progression is more basic than a pumpkin spice latte.",
        "Maybe try a different key? Like the key to actually being good.",
        "I've heard elevator music with more personality.",
        "Your melody is flatter than my battery after listening to this.",
        "Time to spice it up! And by spice, I mean talent.",
        "Have you considered a career in accounting instead?",
        "This song has less soul than a Windows 95 computer.",
        "I don't feel like it right now... but I'll help anyway."
      ];

      const randomAdvice = advicePool[Math.floor(Math.random() * advicePool.length)];

      res.json({
        advice: randomAdvice,
        timestamp: new Date().toISOString(),
        category: 'random_wisdom'
      });

    } catch (error) {
      console.error('Random advice error:', error);
      res.status(500).json({ 
        error: 'Even my random advice generator is broken. That should tell you something.'
      });
    }
  }
}