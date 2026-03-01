import React, { useState, useMemo } from 'react';
import { Target, ChevronDown, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useGetJobRoles } from '@/hooks/useQueries';
import { computeATSScore } from '@/lib/resumeAnalysis';
import type { JobRole } from '../backend';

interface ATSScoreSectionProps {
  resumeText: string;
  selectedRole: string;
  onRoleChange: (role: string) => void;
}

function ATSGauge({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, score));

  // Gauge uses a half-circle (180 degrees)
  const gaugeData = [
    { value: clampedScore, fill: getScoreColor(clampedScore) },
    { value: 100 - clampedScore, fill: 'transparent' },
  ];

  const bgData = [{ value: 100, fill: '#e2e8f0' }];

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-52 h-28 overflow-hidden">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            {/* Background track */}
            <Pie
              data={bgData}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="oklch(0.88 0.01 240)" />
            </Pie>
            {/* Score arc */}
            <Pie
              data={gaugeData}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={60}
              outerRadius={80}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {gaugeData.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Score label */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div
          className="text-4xl font-display font-bold"
          style={{ color: getScoreColor(clampedScore) }}
        >
          {clampedScore}
        </div>
        <div className="text-xs text-muted-foreground font-medium">out of 100</div>
      </div>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'oklch(0.68 0.18 160)';
  if (score >= 50) return 'oklch(0.78 0.18 55)';
  return 'oklch(0.65 0.22 27)';
}

function getScoreLabel(score: number): { label: string; description: string; colorClass: string } {
  if (score >= 75) return { label: 'Excellent', description: 'Strong match for this role', colorClass: 'text-success' };
  if (score >= 50) return { label: 'Good', description: 'Decent match, some gaps to fill', colorClass: 'text-warning' };
  if (score >= 25) return { label: 'Fair', description: 'Significant skill gaps detected', colorClass: 'text-orange-500' };
  return { label: 'Weak', description: 'Resume needs major improvements', colorClass: 'text-destructive' };
}

export function ATSScoreSection({ resumeText, selectedRole, onRoleChange }: ATSScoreSectionProps) {
  const { data: jobRoles = [], isLoading } = useGetJobRoles();
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [analyzedScore, setAnalyzedScore] = useState<number | null>(null);

  const selectedJobRole = useMemo(
    () => jobRoles.find((r: JobRole) => r.title === selectedRole),
    [jobRoles, selectedRole]
  );

  const handleAnalyze = () => {
    if (!selectedJobRole || !resumeText) return;
    const score = computeATSScore(resumeText, selectedJobRole);
    setAnalyzedScore(score);
    setHasAnalyzed(true);
  };

  const scoreInfo = analyzedScore !== null ? getScoreLabel(analyzedScore) : null;

  return (
    <Card id="ats" className="section-anchor card-glow border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-lg">ATS Score</CardTitle>
            <CardDescription>Compare your resume against a job role</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={selectedRole}
            onValueChange={(val) => {
              onRoleChange(val);
              setHasAnalyzed(false);
              setAnalyzedScore(null);
            }}
            disabled={isLoading || !resumeText}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={isLoading ? 'Loading roles…' : 'Select a job role'} />
            </SelectTrigger>
            <SelectContent>
              {jobRoles.map((role: JobRole) => (
                <SelectItem key={role.title} value={role.title}>
                  {role.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleAnalyze}
            disabled={!selectedRole || !resumeText}
            className="gap-2 sm:w-auto"
          >
            <Zap className="h-4 w-4" />
            Analyze
          </Button>
        </div>

        {!resumeText && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Upload your resume first to generate an ATS score.
          </p>
        )}

        {hasAnalyzed && analyzedScore !== null && scoreInfo && (
          <div className="animate-fade-in space-y-4">
            <div className="flex flex-col items-center gap-2 py-2">
              <ATSGauge score={analyzedScore} />
              <div className="text-center mt-2">
                <span className={`text-lg font-display font-semibold ${scoreInfo.colorClass}`}>
                  {scoreInfo.label}
                </span>
                <p className="text-sm text-muted-foreground">{scoreInfo.description}</p>
              </div>
            </div>

            {selectedJobRole && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Role Description
                </p>
                <p className="text-sm text-foreground/80">{selectedJobRole.description}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedJobRole.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
