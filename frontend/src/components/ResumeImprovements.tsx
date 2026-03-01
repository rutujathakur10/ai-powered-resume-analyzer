import React, { useMemo } from 'react';
import { Sparkles, AlertTriangle, ArrowRight, CheckSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { analyzeResumeImprovements } from '@/lib/resumeAnalysis';

interface ResumeImprovementsProps {
  resumeText: string;
}

export function ResumeImprovements({ resumeText }: ResumeImprovementsProps) {
  const improvements = useMemo(() => {
    if (!resumeText) return null;
    return analyzeResumeImprovements(resumeText);
  }, [resumeText]);

  return (
    <Card id="improvements" className="section-anchor card-glow border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-lg">Resume Improvements</CardTitle>
            <CardDescription>Weak verbs detected and formatting suggestions</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!resumeText ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Upload your resume to get improvement suggestions.
          </p>
        ) : !improvements ? (
          <p className="text-sm text-muted-foreground text-center py-6">Analyzing resume…</p>
        ) : (
          <div className="animate-fade-in space-y-5">
            {/* Weak Verbs */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="text-sm font-semibold text-foreground">Weak Action Verbs</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {improvements.weakVerbSuggestions.length} found
                </Badge>
              </div>

              {improvements.weakVerbSuggestions.length === 0 ? (
                <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center">
                  <p className="text-sm font-medium text-success">
                    ✓ No weak verbs detected — great job!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {improvements.weakVerbSuggestions.map((suggestion, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-warning/20 bg-warning/5 p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="text-xs border-warning/40 text-warning bg-warning/10 font-mono"
                        >
                          "{suggestion.weakVerb}"
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <div className="flex flex-wrap gap-1">
                          {suggestion.strongAlternatives.map((alt) => (
                            <Badge
                              key={alt}
                              variant="outline"
                              className="text-xs border-success/40 text-success bg-success/5 font-mono"
                            >
                              {alt}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {suggestion.context && (
                        <p className="text-xs text-muted-foreground italic pl-1">
                          Context: "{suggestion.context}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Formatting Tips */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Formatting Tips</span>
              </div>
              <ul className="space-y-2">
                {improvements.formattingTips.map((tip, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                  >
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground/80">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
