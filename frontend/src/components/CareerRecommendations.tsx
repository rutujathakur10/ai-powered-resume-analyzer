import React, { useMemo } from 'react';
import { Lightbulb, Code2, Award, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCareerRecommendations } from '@/lib/resumeAnalysis';
import { useGetCertifications } from '@/hooks/useQueries';

interface CareerRecommendationsProps {
  missingSkills: string[];
  hasResume: boolean;
  hasRole: boolean;
}

interface RecommendationCardProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

function RecommendationCard({
  icon,
  title,
  items,
  colorClass,
  bgClass,
  borderClass,
}: RecommendationCardProps) {
  return (
    <div className={`rounded-xl border ${borderClass} ${bgClass} p-4 space-y-3`}>
      <div className="flex items-center gap-2">
        <span className={colorClass}>{icon}</span>
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {items.length}
        </Badge>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
            <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${colorClass.replace('text-', 'bg-')}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CareerRecommendations({
  missingSkills,
  hasResume,
  hasRole,
}: CareerRecommendationsProps) {
  const { data: certifications = [] } = useGetCertifications();

  const recommendations = useMemo(() => {
    if (missingSkills.length === 0) return null;
    return getCareerRecommendations(missingSkills, certifications);
  }, [missingSkills, certifications]);

  return (
    <Card id="recommendations" className="section-anchor card-glow border-border/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-lg">Career Recommendations</CardTitle>
            <CardDescription>Personalized suggestions based on your skill gaps</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!hasResume || !hasRole ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {!hasResume
              ? 'Upload your resume to get career recommendations.'
              : 'Select a job role to see personalized recommendations.'}
          </p>
        ) : missingSkills.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <div className="text-3xl">🎉</div>
            <p className="text-sm font-medium text-foreground">All required skills matched!</p>
            <p className="text-xs text-muted-foreground">
              Your resume covers all the required skills for this role.
            </p>
          </div>
        ) : !recommendations ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Generating recommendations…
          </p>
        ) : (
          <div className="animate-fade-in space-y-4">
            <p className="text-sm text-muted-foreground">
              Based on{' '}
              <span className="font-medium text-foreground">{missingSkills.length} missing skill{missingSkills.length !== 1 ? 's' : ''}</span>
              , here's what we recommend:
            </p>

            <div className="grid grid-cols-1 gap-4">
              <RecommendationCard
                icon={<Code2 className="h-4 w-4" />}
                title="Projects to Build"
                items={recommendations.projects}
                colorClass="text-primary"
                bgClass="bg-primary/5"
                borderClass="border-primary/20"
              />
              <RecommendationCard
                icon={<Award className="h-4 w-4" />}
                title="Certifications to Complete"
                items={recommendations.certifications}
                colorClass="text-success"
                bgClass="bg-success/5"
                borderClass="border-success/20"
              />
              <RecommendationCard
                icon={<Wrench className="h-4 w-4" />}
                title="Tools to Learn"
                items={recommendations.tools}
                colorClass="text-warning"
                bgClass="bg-warning/5"
                borderClass="border-warning/20"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
