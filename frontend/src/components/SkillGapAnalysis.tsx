import React, { useMemo } from 'react';
import { BarChart2, CheckCircle2, XCircle } from 'lucide-react';
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
} from 'recharts';
import { analyzeSkillGap } from '@/lib/resumeAnalysis';
import type { JobRole } from '../backend';

interface SkillGapAnalysisProps {
  resumeText: string;
  selectedRole: string;
  jobRoles: JobRole[];
  onMissingSkills: (skills: string[]) => void;
}

export function SkillGapAnalysis({
  resumeText,
  selectedRole,
  jobRoles,
  onMissingSkills,
}: SkillGapAnalysisProps) {
  const selectedJobRole = useMemo(
    () => jobRoles.find((r) => r.title === selectedRole),
    [jobRoles, selectedRole]
  );

  const analysis = useMemo(() => {
    if (!selectedJobRole || !resumeText) return null;
    const result = analyzeSkillGap(resumeText, selectedJobRole);
    onMissingSkills(result.missingSkills);
    return result;
  }, [selectedJobRole, resumeText, onMissingSkills]);

  const chartData = useMemo(() => {
    if (!analysis) return [];
    return [
      {
        name: 'Matched',
        value: analysis.matchedSkills.length,
        fill: 'oklch(0.68 0.18 160)',
      },
      {
        name: 'Missing',
        value: analysis.missingSkills.length,
        fill: 'oklch(0.65 0.22 27)',
      },
    ];
  }, [analysis]);

  return (
    <Card id="skills" className="section-anchor card-glow border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <BarChart2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-lg">Skill Gap Analysis</CardTitle>
            <CardDescription>Matched vs. missing skills for the selected role</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {!resumeText || !selectedRole ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {!resumeText
              ? 'Upload your resume to see skill gap analysis.'
              : 'Select a job role to see skill gap analysis.'}
          </p>
        ) : !analysis ? (
          <p className="text-sm text-muted-foreground text-center py-6">Analyzing skills…</p>
        ) : (
          <div className="animate-fade-in space-y-5">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-success/30 bg-success/5 p-3 text-center">
                <div className="text-2xl font-display font-bold text-success">
                  {analysis.matchedSkills.length}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Matched</div>
              </div>
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-center">
                <div className="text-2xl font-display font-bold text-destructive">
                  {analysis.missingSkills.length}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Missing</div>
              </div>
              <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-center">
                <div className="text-2xl font-display font-bold text-warning">
                  {analysis.gapPercentage}%
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Gap</div>
              </div>
            </div>

            {/* Bar chart */}
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="oklch(0.88 0.01 240)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <Tooltip
                    cursor={{ fill: 'oklch(0.93 0.01 240 / 0.5)' }}
                    contentStyle={{
                      background: 'oklch(1 0 0)',
                      border: '1px solid oklch(0.88 0.01 240)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Skill lists */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Matched skills */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-foreground">Matched Skills</span>
                </div>
                {analysis.matchedSkills.length === 0 ? (
                  <p className="text-xs text-muted-foreground pl-6">No matched skills found</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {analysis.matchedSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="text-xs border-success/40 text-success bg-success/5"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Missing skills */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-foreground">Missing Skills</span>
                </div>
                {analysis.missingSkills.length === 0 ? (
                  <p className="text-xs text-muted-foreground pl-6">All required skills matched! 🎉</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pl-6">
                    {analysis.missingSkills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="text-xs border-destructive/40 text-destructive bg-destructive/5"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
