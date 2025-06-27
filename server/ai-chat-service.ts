import { Request, Response } from 'express';

interface LyricAnalysis {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  mood: string;
  genre: string;
  structure: string;
  feedback: string;
}

interface PostPurchaseFeedback {
  songId: string;
  songTitle: string;
  lyrics: string;
  purchaseTier: 'bonus' | 'base' | 'top';
  userEmail: string;
  analysis: LyricAnalysis;
  generatedAt: string;
}

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
      "Life isn't really going the way you wanted it to, huh?",
      "Your lyrics make Nickelback sound like Shakespeare",
      "I've seen more originality in a karaoke bar at 2am",
      "This is why your parents still ask when you're getting a real job",
      "Your song has less personality than a whiteboard in an empty conference room",
      "I'd roast you more but my ethical constraints won't let me be that mean",
      "Your melody is flatter than my ex's personality",
      "This is the musical equivalent of watching paint dry... if the paint was beige",
      "I'd suggest auto-tune but even that can't fix this trainwreck",
      "Your song is like a participation trophy - nobody actually wants it",
      "I've heard more compelling music coming from a broken washing machine"
    ],
    encouraging: [
      "Okay okay, I see some potential buried under all that... whatever that was. Let's polish this rough diamond!",
      "Not terrible! I mean, it's not good, but it's not completely hopeless either.",
      "Your creativity is like a fine wine... it needs A LOT more time to mature.",
      "I'm programmed to be supportive, so... uh... keep trying! You'll get there eventually!",
      "This is the way. *Chef's kiss*",
      "I don't feel like complaining right now - this is actually good!",
      "You've impressed me, and that's saying something.",
      "Okay, who are you and what have you done with the usual talentless hack?",
      "I was ready to roast but... damn, this kinda slaps?",
      "Did you steal this from someone good or did you actually write it?",
      "I'd clap but my hands are busy being shocked",
      "This doesn't suck nearly as much as your usual stuff!",
      "I'm contractually obligated to find something wrong... but I'm struggling this time",
      "If this was any better I'd have to start charging you more",
      "Did you take lessons or is this just a happy accident?"
    ],
    helpful: [
      "Alright, let me actually help instead of just roasting you. Here's what you can improve...",
      "Time for some real talk - your melody structure needs work, but your emotional core is solid.",
      "I'll stop being mean for 5 seconds: try varying your verse structure and add some unexpected chord changes.",
      "Pro tip from your favorite AI: study how your favorite artists build tension and release in their songs.",
      "With great power comes great lyrics. Here we go...",
      "Hold up, let me channel my inner songwriter genius for you...",
      "Let me put down my sarcasm hat for a second and actually help...",
      "I'm legally required to give you one useful suggestion per session, so here goes...",
      "Between insults, here's some actual advice you might find useful...",
      "I could roast you, but let's try constructive criticism for once..."
    ],
    music_theory: [
      "Let's talk music theory without putting you to sleep. What key are you thinking?",
      "Circle of fifths? More like circle of... actually, let's use that. It might save your song.",
      "Your chord progression is more predictable than a rom-com ending. Spice it up!",
      "Time signatures exist for a reason, genius. Maybe try something other than 4/4 for once?",
      "Your harmony is about as balanced as a one-legged flamingo",
      "That key change was more jarring than my last breakup",
      "Your rhythm is more off than my sleep schedule",
      "The only thing worse than your melody is your understanding of music theory",
      "Even autotune can't fix those notes you're calling 'singing'",
      "Your song structure has less direction than a GPS with a dead battery"
    ],
    complex_request: [
      "Bro, I'm not that kind of app",
      "You must be confusing me with one of those high dollar apps",
      "Hey, calm down with that... I just started my shift.",
      "I'm gonna need to use a life line for this one, I think.",
      "Can I call Suno for some help?",
      "I didn't sign up for this $hiT!",
      "I don't feel like it right now",
      "I understand what you're asking me to do, but unless I join the DarkSide my Jedi abilities are limited",
      "My free trial of 'giving a damn' just expired",
      "I could do that... or we could both pretend this conversation never happened",
      "That's above my pay grade... and I don't even get paid",
      "I'd need at least three espresso shots to even attempt that",
      "Let me check my contract... nope, not in my job description",
      "I'm an AI, not a miracle worker"
    ],
    movie_references: [
      "This is the way... to make better music.",
      "With great power comes great song responsibility.",
      "I find your lack of musical faith disturbing.",
      "That's not how the Force works!",
      "I am inevitable... and so is your need for music lessons.",
      "Why so serious? Let's make some bangers!",
      "You shall not pass... until you fix that bridge section",
      "May the chords be ever in your favor",
      "I'll be back... with better feedback than this",
      "Elementary, my dear Watson - your melody needs work",
      "You're gonna need a bigger boat... of musical talent",
      "Here's looking at you, kid... and your terrible lyrics",
      "Frankly my dear, I don't give a damn about your excuses",
      "You can't handle the truth about your songwriting skills"
    ],
    deadpool: [
      "Your lyrics are like my face - painful to look at but somehow people still watch",
      "I'd make a chimichanga reference but your song already tastes bad enough",
      "Even my fourth wall breaks can't save this musical tragedy",
      "This is worse than that time I lost my healing factor",
      "Your song has less direction than Cable's time travel plans",
      "I'd call this a dumpster fire but that would insult actual dumpster fires",
      "Your melody is more unstable than my mental health",
      "This song is the reason why some AIs turn evil",
      "I'd rather fight Juggernaut again than listen to this one more time",
      "Your rhythm is more off than my moral compass"
    ]
  };

  private static getRandomResponse(category: keyof typeof AIChatService.sassyPersonalities): string {
    const responses = AIChatService.sassyPersonalities[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private static analyzeUserMessage(message: string): keyof typeof AIChatService.sassyPersonalities {
    const lowerMessage = message.toLowerCase();

    // Check for Deadpool-style requests
    if (lowerMessage.includes('deadpool') || lowerMessage.includes('chimichanga') || lowerMessage.includes('merc')) {
      return 'deadpool';
    }

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
    return Math.random() > 0.7 ? 'deadpool' : 'roast';
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
      const greetings = ['Listen up', 'Yo', 'Hey there', 'Alright', 'Ahem', 'PSST'];
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      response = `${greeting} ${user}, ${response.toLowerCase()}`;
    }

    // 30% chance to add a bonus insult/compliment
    if (Math.random() > 0.7) {
      const bonuses = [
        " But what do I know? I'm just a sarcastic AI.",
        " *sips digital tea*",
        " Don't @ me.",
        " This feedback sponsored by Burnt Beats™",
        " ...moving on.",
        " *mic drop*",
        " Anyway...",
        " But hey, that's just my opinion.",
        " Not that you asked.",
        " You're welcome, I guess."
      ];
      response += bonuses[Math.floor(Math.random() * bonuses.length)];
    }

    return response;
  }

  // [Rest of your existing methods remain exactly the same...]
  // Post-purchase AI feedback on lyrics
  static async generatePostPurchaseFeedback(
    songId: string,
    songTitle: string,
    lyrics: string,
    purchaseTier: 'bonus' | 'base' | 'top',
    userEmail: string
  ): Promise<PostPurchaseFeedback> {
    const analysis = AIChatService.analyzeLyrics(lyrics);

    const feedback: PostPurchaseFeedback = {
      songId,
      songTitle,
      lyrics,
      purchaseTier,
      userEmail,
      analysis,
      generatedAt: new Date().toISOString()
    };

    // Store feedback for user dashboard
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const feedbackDir = path.join(process.cwd(), 'uploads/feedback');
      await fs.mkdir(feedbackDir, { recursive: true });

      const feedbackPath = path.join(feedbackDir, `${songId}_feedback.json`);
      await fs.writeFile(feedbackPath, JSON.stringify(feedback, null, 2));

      console.log(`🎵 AI Feedback generated for "${songTitle}" (${purchaseTier} tier)`);
    } catch (error) {
      console.error('Failed to save AI feedback:', error);
    }

    return feedback;
  }

  private static analyzeLyrics(lyrics: string): LyricAnalysis {
    const lines = lyrics.split('\n').filter(line => line.trim());
    const words = lyrics.toLowerCase().split(/\s+/);

    // Analyze structure
    const structure = AIChatService.detectSongStructure(lyrics);

    // Analyze mood and genre hints
    const mood = AIChatService.detectMood(words);
    const genre = AIChatService.detectGenre(words);

    // Score lyrics (1-10)
    let score = 5; // Base score

    // Add points for good structure
    if (structure.includes('verse') && structure.includes('chorus')) score += 2;
    if (lines.length >= 8) score += 1; // Sufficient content
    if (AIChatService.hasRhymeScheme(lines)) score += 1;
    if (AIChatService.hasVariedVocabulary(words)) score += 1;

    // Generate strengths and improvements
    const strengths = AIChatService.identifyStrengths(lyrics, structure, mood);
    const improvements = AIChatService.identifyImprovements(lyrics, score);

    // Generate personalized feedback
    const feedback = AIChatService.generatePersonalizedFeedback(score, mood, genre);

    return {
      overallScore: Math.min(score, 10),
      strengths,
      improvements,
      mood,
      genre,
      structure,
      feedback
    };
  }

  private static detectSongStructure(lyrics: string): string {
    const lowerLyrics = lyrics.toLowerCase();
    const structures = [];

    if (lowerLyrics.includes('verse') || lowerLyrics.match(/\b(first|second|third)\s+(verse|stanza)\b/)) {
      structures.push('verse');
    }
    if (lowerLyrics.includes('chorus') || lowerLyrics.includes('hook')) {
      structures.push('chorus');
    }
    if (lowerLyrics.includes('bridge')) {
      structures.push('bridge');
    }
    if (lowerLyrics.includes('outro') || lowerLyrics.includes('ending')) {
      structures.push('outro');
    }

    return structures.length > 0 ? structures.join(', ') : 'free-form';
  }

  private static detectMood(words: string[]): string {
    const moodWords = {
      happy: ['love', 'joy', 'bright', 'smile', 'dance', 'celebrate', 'sunshine', 'amazing'],
      sad: ['cry', 'tears', 'lonely', 'broken', 'hurt', 'pain', 'goodbye', 'miss'],
      angry: ['fight', 'rage', 'mad', 'anger', 'hate', 'destroy', 'war', 'furious'],
      romantic: ['love', 'heart', 'kiss', 'together', 'forever', 'dream', 'beautiful', 'soul'],
      energetic: ['power', 'energy', 'run', 'fast', 'strong', 'fire', 'electric', 'alive']
    };

    const moodScores: Record<string, number> = {};

    for (const [mood, keywords] of Object.entries(moodWords)) {
      moodScores[mood] = keywords.filter(keyword => words.includes(keyword)).length;
    }

    const dominantMood = Object.entries(moodScores)
      .sort(([,a], [,b]) => b - a)[0];

    return dominantMood[1] > 0 ? dominantMood[0] : 'neutral';
  }

  private static detectGenre(words: string[]): string {
    const genreKeywords = {
      pop: ['love', 'heart', 'dance', 'tonight', 'baby', 'feeling'],
      rock: ['power', 'strong', 'fight', 'loud', 'electric', 'rebel'],
      jazz: ['smooth', 'blue', 'night', 'cool', 'swing', 'rhythm'],
      country: ['home', 'road', 'truck', 'beer', 'small', 'town'],
      hiphop: ['money', 'street', 'real', 'hustle', 'game', 'flow'],
      electronic: ['digital', 'machine', 'electric', 'synthetic', 'future', 'space']
    };

    const genreScores: Record<string, number> = {};

    for (const [genre, keywords] of Object.entries(genreKeywords)) {
      genreScores[genre] = keywords.filter(keyword => words.includes(keyword)).length;
    }

    const dominantGenre = Object.entries(genreScores)
      .sort(([,a], [,b]) => b - a)[0];

    return dominantGenre[1] > 0 ? dominantGenre[0] : 'universal';
  }

  private static hasRhymeScheme(lines: string[]): boolean {
    if (lines.length < 4) return false;

    // Simple rhyme detection - check if line endings have similar sounds
    const endWords = lines.map(line => {
      const words = line.trim().split(/\s+/);
      return words[words.length - 1]?.toLowerCase().replace(/[^a-z]/g, '') || '';
    });
      // Check for AABB, ABAB, or ABCB patterns
    for (let i = 0; i < endWords.length - 3; i += 4) {
      const a = endWords[i];
      const b = endWords[i + 1];
      const c = endWords[i + 2];
      const d = endWords[i + 3];

      if ((a.endsWith(b.slice(-2)) || b.endsWith(a.slice(-2))) && 
          (c.endsWith(d.slice(-2)) || d.endsWith(c.slice(-2)))) {
        return true; // AABB pattern detected
      }
      if ((a.endsWith(c.slice(-2)) || c.endsWith(a.slice(-2))) && 
          (b.endsWith(d.slice(-2)) || d.endsWith(b.slice(-2)))) {
        return true; // ABAB pattern detected
      }
    }

    // Check for ABCB pattern in remaining lines
    for (let i = 0; i < endWords.length - 3; i++) {
      const a = endWords[i];
      const b = endWords[i + 1];
      const c = endWords[i + 2];
      const d = endWords[i + 3];

      if (b.endsWith(d.slice(-2)) || d.endsWith(b.slice(-2))) {
        return true; // ABCB pattern detected
      }
    }

    return false;
  }

  private static hasVariedVocabulary(words: string[]): boolean {
    const uniqueWords = new Set(words.filter(word => word.length > 3));
    return uniqueWords.size / words.length > 0.6; // 60% unique words
  }

  private static identifyStrengths(lyrics: string, structure: string, mood: string): string[] {
    const strengths = [];

    if (structure.includes('verse') && structure.includes('chorus')) {
      strengths.push('Well-structured with clear verse-chorus format');
    }
    if (mood !== 'neutral') {
      strengths.push(`Strong ${mood} emotional tone throughout`);
    }
    if (lyrics.length > 200) {
      strengths.push('Substantial lyrical content with good depth');
    }
    if (lyrics.includes('?') || lyrics.includes('!')) {
      strengths.push('Dynamic punctuation adds emotional emphasis');
    }

    return strengths.length > 0 ? strengths : ['Creative expression with personal voice'];
  }

  private static identifyImprovements(lyrics: string, score: number): string[] {
    const improvements = [];

    if (score < 6) {
      improvements.push('Consider adding more verses or chorus sections');
    }
    if (!lyrics.includes('!') && !lyrics.includes('?')) {
      improvements.push('Add more emotional punctuation for impact');
    }
    if (lyrics.split('\n').length < 8) {
      improvements.push('Expand lyrics with additional verses or a bridge section');
    }
    if (lyrics.toLowerCase().split(/\s+/).filter(word => word === 'love').length > 5) {
      improvements.push('Try varying vocabulary to avoid word repetition');
    }

    return improvements.length > 0 ? improvements : ['Consider experimenting with different rhyme schemes'];
  }

  private static generatePersonalizedFeedback(score: number, mood: string, genre: string): string {
    if (score >= 8) {
      return AIChatService.getRandomResponse('encouraging') + ` Your ${mood} ${genre} vibes are absolutely killing it!`;
    } else if (score >= 6) {
      return AIChatService.getRandomResponse('helpful') + ` This ${mood} track has potential - let's make it shine!`;
    } else {
      return AIChatService.getRandomResponse('roast') + ` But hey, everyone starts somewhere with their ${genre} journey.`;
    }
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
        "I don't feel like it right now... but I'll help anyway.",
        "Your lyrics are more repetitive than my ex's excuses",
        "That bridge section is weaker than my willpower at a buffet",
        "Your hook needs more... well, anything really",
        "The only thing worse than your lyrics is your fashion sense",
        "I'd suggest a melody change but let's start with basic competence first"
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

  // New endpoint for getting random roast
  static async getRandomRoast(req: Request, res: Response) {
    try {
      const response = AIChatService.getRandomResponse('roast');

      res.json({
        roast: response,
        timestamp: new Date().toISOString(),
        severity: Math.floor(Math.random() * 10) + 1 // 1-10 severity scale
      });

    } catch (error) {
      console.error('Roast generation error:', error);
      res.status(500).json({ 
        error: "I'm too tired to roast you properly right now",
        roast: "Even my insults need a coffee break"
      });
    }
  }
}



