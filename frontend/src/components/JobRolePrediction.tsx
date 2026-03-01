import React, { useMemo } from 'react';
import { BrainCircuit, Lightbulb, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { predictJobRoles } from '@/lib/resumeAnalysis';
import { useGetJobRoles } from '@/hooks/useQueries';
import type { JobRole } from '../backend';

interface JobRolePredictionProps {
  resumeText: string;
}

const CONFIDENCE_COLORS = [
  'oklch(0.62 0.22 260)',
  'oklch(0.68 0.18 160)',
  'oklch(0.78 0.18 55)',
];

const CONFIDENCE_BG_COLORS = [
  'oklch(0.62 0.22 260 / 0.08)',
  'oklch(0.68 0.18 160 / 0.08)',
  'oklch(0.78 0.18 55 / 0.08)',
];

export function JobRolePrediction({ resumeText }: JobRolePredictionProps) {
  const { data: jobRoles = [], isLoading } = useGetJobRoles();

  const predictions = useMemo(() => {
    if (!resumeText || jobRoles.length === 0) return [];
    return predictJobRoles(resumeText, jobRoles as JobRole[]);
  }, [resumeText, jobRoles]);

  const chartData = predictions.map((p, i) => ({
    role: p.role,
    confidence: p.confidence,
    fill: CONFIDENCE_COLORS[i] || CONFIDENCE_COLORS[2],
  }));

  return (
    <Card id="prediction" className="section-anchor card-glow border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-lg">Job Role Prediction</CardTitle>
            <CardDescription>Top 3 most suitable roles based on your resume</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!resumeText ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Upload your resume to see job role predictions.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-6">Loading job roles…</p>
        ) : predictions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No predictions available. Try uploading a more detailed resume.
          </p>
        ) : (
          <div className="animate-fade-in space-y-5">
            {/* Ranked list with explanations */}
            <div className="space-y-4">
              {predictions.map((pred, index) => (
                <div
                  key={pred.role}
                  className="rounded-xl border border-border/50 overflow-hidden"
                  style={{ background: CONFIDENCE_BG_COLORS[index] }}
                >
                  {/* Header row: rank + role + confidence */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground"
                      style={{ background: CONFIDENCE_COLORS[index] }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {pred.role}
                        </span>
                        <Badge
                          variant="secondary"
                          className="ml-2 flex-shrink-0 text-xs font-semibold"
                          style={{ color: CONFIDENCE_COLORS[index] }}
                        >
                          {pred.confidence}%
                        </Badge>
                      </div>
                      {/* Confidence progress bar */}
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${pred.confidence}%`,
                            background: CONFIDENCE_COLORS[index],
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Explanation section */}
                  <div className="px-4 pb-4 pt-2 space-y-3">
                    {/* Detected Skills */}
                    {pred.detectedSkills.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2
                            className="h-3.5 w-3.5 flex-shrink-0"
                            style={{ color: CONFIDENCE_COLORS[index] }}
                          />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Detected Skills
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {pred.detectedSkills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-xs px-2 py-0.5 border-border/60 bg-background/60"
                              style={{ color: CONFIDENCE_COLORS[index] }}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matching Factors */}
                    {pred.matchingFactors.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Lightbulb
                            className="h-3.5 w-3.5 flex-shrink-0"
                            style={{ color: CONFIDENCE_COLORS[index] }}
                          />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Matching Factors
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {pred.matchingFactors.map((factor) => (
                            <span
                              key={factor}
                              className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground font-mono"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Fallback when no explanation data */}
                    {pred.detectedSkills.length === 0 && pred.matchingFactors.length === 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        Upload a more detailed resume to see skill explanations.
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div className="h-44 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 16, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.88 0.01 240)" />
                  <XAxis
                    dataKey="role"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    cursor={{ fill: 'oklch(0.93 0.01 240 / 0.5)' }}
                    formatter={(value: number) => [`${value}%`, 'Confidence']}
                    contentStyle={{
                      background: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.88 0.01 240)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="confidence" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="confidence"
                      position="top"
                      formatter={(v: number) => `${v}%`}
                      style={{ fontSize: '11px', fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
