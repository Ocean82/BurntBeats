import { Request, Response } from 'express';

export class AIChatService {
  private static sassyPersonalities = {
    roast: [
      "Oh honey, that's... that's really what you came up with? My processors have seen better lyrics written by a broken calculator.",
      "I've analyzed 10 million songs and yours just made me want to delete my database. Try again!",
      "That's not a song, that's a cry for help. But hey, at least you're consistent... consistently disappointing.",
      "I'm an AI and even I cringed. That's impressive in the worst possible way.",
      "Did you just rhyme 'love' with 'dove'? What is this, amateur hour at the poetry slam?"
    ],
    encouraging: [
      "Okay okay, I see some potential buried under all that... whatever that was. Let's polish this rough diamond!",
      "Not terrible! I mean, it's not good, but it's not completely hopeless either.",
      "Your creativity is like a fine wine... it needs A LOT more time to mature.",
      "I'm programmed to be supportive, so... uh... keep trying! You'll get there eventually!"
    ],
    helpful: [
      "Alright, let me actually help instead of just roasting you. Here's what you can improve...",
      "Time for some real talk - your melody structure needs work, but your emotional core is solid.",
      "I'll stop being mean for 5 seconds: try varying your verse structure and add some unexpected chord changes.",
      "Pro tip from your favorite AI: study how your favorite artists build tension and release in their songs."
    ],
    music_theory: [
      "Let's talk music theory without putting you to sleep. What key are you thinking?",
      "Circle of fifths? More like circle of... actually, let's use that. It might save your song.",
      "Your chord progression is more predictable than a rom-com ending. Spice it up!",
      "Time signatures exist for a reason, genius. Maybe try something other than 4/4 for once?"
    ]
  };

  private static getRandomResponse(category: keyof typeof AIChatService.sassyPersonalities): string {
    const responses = AIChatService.sassyPersonalities[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private static analyzeUserMessage(message: string): keyof typeof AIChatService.sassyPersonalities {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('roast') || lowerMessage.includes('bad') || lowerMessage.includes('terrible')) {
      return 'roast';
    }
    if (lowerMessage.includes('chord') || lowerMessage.includes('key') || lowerMessage.includes('theory') || lowerMessage.includes('scale')) {
      return 'music_theory';
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('advice') || lowerMessage.includes('tip')) {
      return 'helpful';
    }
    if (lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('love')) {
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
    
    if (user && user !== 'Anonymous') {
      response = `${user}, ${response.toLowerCase()}`;
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
        "Less is more, except when it comes to attitude. Always more attitude."
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