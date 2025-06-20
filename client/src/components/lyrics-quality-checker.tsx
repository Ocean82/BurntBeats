import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  RefreshCw,
  Sparkles
} from "lucide-react";

interface LyricsQualityCheckerProps {
  lyrics: string;
  onQualityChecked: (quality: QualityResult) => void;
}

interface QualityResult {
  score: number;
  issues: string[];
  suggestions: string[];
  aiComment: string;
  shouldBlock: boolean;
}

export default function LyricsQualityChecker({ lyrics, onQualityChecked }: LyricsQualityCheckerProps) {
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (lyrics.trim().length > 10) {
      checkLyricsQuality(lyrics);
    }
  }, [lyrics]);

  const checkLyricsQuality = async (text: string) => {
    setIsChecking(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const result = analyzeLyrics(text);
    setQualityResult(result);
    onQualityChecked(result);
    setIsChecking(false);
  };

  const analyzeLyrics = (text: string): QualityResult => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const words = text.split(/\s+/).filter(word => word.length > 0);
    
    let score = 100;
    const issues: string[] = [];
    const suggestions: string[] = [];
    let aiComment = "";
    let shouldBlock = false;

    // Check for extremely short lyrics
    if (words.length < 10) {
      score -= 40;
      issues.push("Too short");
      suggestions.push("Add more content - I need something to work with here");
      aiComment = "Umm... that's it? I've seen grocery lists with more creativity. Try adding a few more lines?";
      shouldBlock = true;
    }

    // Check for repetitive content
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    if (uniqueWords.size < words.length * 0.3) {
      score -= 30;
      issues.push("Very repetitive");
      suggestions.push("Mix up your vocabulary - variety is the spice of lyrics");
    }

    // Check for basic rhyme attempts
    const hasBasicRhymes = checkForRhymes(lines);
    if (!hasBasicRhymes && lines.length > 2) {
      score -= 25;
      issues.push("No rhyme scheme detected");
      suggestions.push("Try making some lines rhyme - it's music, not a grocery list");
    }

    // Check for extremely basic or lazy content
    const lazyPatterns = [
      /^(la la la|na na na|yeah yeah yeah|oh oh oh)+$/i,
      /^(1 2 3|a b c|do re mi)+$/i,
      /^test+$/i,
      /^hello+$/i,
      /^(asdf|qwerty|123)+$/i
    ];

    const isLazy = lazyPatterns.some(pattern => 
      lines.some(line => pattern.test(line.trim()))
    );

    if (isLazy) {
      score -= 50;
      issues.push("Lazy placeholder content");
      suggestions.push("Put some actual effort in - I'm not a miracle worker");
      aiComment = "Did you just keyboard smash and hope for the best? Maybe grab a pencil and try again?";
      shouldBlock = true;
    }

    // Check for all caps (screaming)
    if (text === text.toUpperCase() && text.length > 20) {
      score -= 15;
      issues.push("All caps detected");
      suggestions.push("Turn off caps lock - we can hear you just fine");
      aiComment = "Why are we screaming? Turn off caps lock and try again without the attitude.";
    }

    // Check for no punctuation at all
    if (!/[.!?,:;]/.test(text) && words.length > 15) {
      score -= 10;
      issues.push("No punctuation");
      suggestions.push("Add some punctuation - it helps with the flow");
    }

    // Generate sassy AI comments based on quality
    if (!aiComment) {
      if (score >= 80) {
        const goodComments = [
          "Now we're talking! This has potential.",
          "Not bad! I can work with this energy.",
          "Okay, you came to play. Let's make something fire.",
          "Finally, some quality content to work with!"
        ];
        aiComment = goodComments[Math.floor(Math.random() * goodComments.length)];
      } else if (score >= 60) {
        const okComments = [
          "It's... okay. Could use some polish but we can work with this.",
          "I've seen worse. Let's see what we can do with it.",
          "Decent foundation, but let's spice it up a bit.",
          "This is like a rough draft of something good."
        ];
        aiComment = okComments[Math.floor(Math.random() * okComments.length)];
      } else if (score >= 40) {
        const mehComments = [
          "This feels like something my grandma would come up with. Can we try harder?",
          "Are you sure you want to submit this? I mean, I'll try, but...",
          "This has 'wrote it in 30 seconds' energy. Take your time!",
          "I've seen better lyrics on cereal boxes. Want to give it another shot?"
        ];
        aiComment = mehComments[Math.floor(Math.random() * mehComments.length)];
      } else {
        const badComments = [
          "Maybe you should get your pencil back out and try again?",
          "This sounds like something my grandma came up with after a nap.",
          "Did you outsource this to a random word generator?",
          "I'm good, but I'm not 'turn this into gold' good. Help me help you!",
          "Even auto-generated lyrics have more soul than this."
        ];
        aiComment = badComments[Math.floor(Math.random() * badComments.length)];
        shouldBlock = true;
      }
    }

    return {
      score: Math.max(0, score),
      issues,
      suggestions,
      aiComment,
      shouldBlock
    };
  };

  const checkForRhymes = (lines: string[]): boolean => {
    if (lines.length < 2) return false;
    
    // Simple rhyme detection - check if line endings sound similar
    const endings = lines.map(line => {
      const words = line.trim().split(/\s+/);
      const lastWord = words[words.length - 1]?.toLowerCase().replace(/[^\w]/g, '');
      return lastWord?.slice(-2) || ''; // Last 2 characters as simple rhyme check
    });
    
    // Check if any endings match
    for (let i = 0; i < endings.length; i++) {
      for (let j = i + 1; j < endings.length; j++) {
        if (endings[i] && endings[j] && endings[i] === endings[j]) {
          return true;
        }
      }
    }
    
    return false;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    if (score >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { color: "bg-green-500/20 text-green-400", label: "Fire!" };
    if (score >= 60) return { color: "bg-yellow-500/20 text-yellow-400", label: "Decent" };
    if (score >= 40) return { color: "bg-orange-500/20 text-orange-400", label: "Needs Work" };
    return { color: "bg-red-500/20 text-red-400", label: "Rough Draft" };
  };

  if (!lyrics.trim() || lyrics.trim().length <= 10) {
    return null;
  }

  if (isChecking) {
    return (
      <Card className="bg-dark-card border-gray-800 mb-4">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Checking lyrics quality...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!qualityResult) return null;

  const scoreBadge = getScoreBadge(qualityResult.score);

  return (
    <Card className="bg-dark-card border-gray-800 mb-4">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Score Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {qualityResult.score >= 60 ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : qualityResult.shouldBlock ? (
                <XCircle className="w-5 h-5 text-red-400" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              )}
              <span className="font-medium text-white">Lyrics Quality Check</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`font-bold ${getScoreColor(qualityResult.score)}`}>
                {qualityResult.score}/100
              </span>
              <Badge className={scoreBadge.color}>
                {scoreBadge.label}
              </Badge>
            </div>
          </div>

          {/* AI Comment */}
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-sm text-gray-300">
              <Sparkles className="w-4 h-4 inline mr-1 text-purple-400" />
              <strong>BangerGPT says:</strong> {qualityResult.aiComment}
            </p>
          </div>

          {/* Issues & Suggestions */}
          {(qualityResult.issues.length > 0 || qualityResult.suggestions.length > 0) && (
            <div className="space-y-2">
              {qualityResult.issues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-red-400 mb-1">Issues Found:</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {qualityResult.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {qualityResult.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-400 mb-1 flex items-center">
                    <Lightbulb className="w-3 h-3 mr-1" />
                    Suggestions:
                  </h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    {qualityResult.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Block Generation Warning */}
          {qualityResult.shouldBlock && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-300">
                <XCircle className="w-4 h-4 inline mr-1" />
                <strong>Hold up!</strong> These lyrics need more work before I can create something good with them. 
                Take a moment to improve them and I'll give you something amazing in return.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}