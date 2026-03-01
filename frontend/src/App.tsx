import React, { useState, useCallback } from 'react';
import { FileText, Target, BarChart2, BrainCircuit, Lightbulb, Sparkles, Heart, Menu, X } from 'lucide-react';
import { ResumeUpload } from './components/ResumeUpload';
import { ATSScoreSection } from './components/ATSScoreSection';
import { SkillGapAnalysis } from './components/SkillGapAnalysis';
import { JobRolePrediction } from './components/JobRolePrediction';
import { CareerRecommendations } from './components/CareerRecommendations';
import { ResumeImprovements } from './components/ResumeImprovements';
import { useGetJobRoles } from './hooks/useQueries';
import type { JobRole } from './backend';

const NAV_ITEMS = [
  { id: 'upload', label: 'Upload', icon: FileText },
  { id: 'ats', label: 'ATS Score', icon: Target },
  { id: 'skills', label: 'Skill Gap', icon: BarChart2 },
  { id: 'prediction', label: 'Prediction', icon: BrainCircuit },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  { id: 'improvements', label: 'Improvements', icon: Sparkles },
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function App() {
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: jobRoles = [] } = useGetJobRoles();

  const handleTextExtracted = useCallback((text: string, name: string) => {
    setResumeText(text);
    setFileName(name);
    if (!text) {
      setSelectedRole('');
      setMissingSkills([]);
    }
  }, []);

  const handleMissingSkills = useCallback((skills: string[]) => {
    setMissingSkills(skills);
  }, []);

  const appId = typeof window !== 'undefined'
    ? encodeURIComponent(window.location.hostname)
    : 'resume-analyzer';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <img
                  src="/assets/generated/resume-icon.dim_128x128.png"
                  alt="Resume Analyzer"
                  className="h-5 w-5 object-contain"
                />
              </div>
              <div>
                <span className="font-display font-bold text-foreground text-lg leading-none">
                  ResumeAI
                </span>
                <span className="block text-xs text-muted-foreground leading-none mt-0.5">
                  Analyzer
                </span>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </nav>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted/60 transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile nav */}
          {mobileMenuOpen && (
            <nav className="md:hidden border-t border-border/60 py-3 grid grid-cols-3 gap-1">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => {
                    scrollToSection(id);
                    setMobileMenuOpen(false);
                  }}
                  className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Hero banner */}
      <div className="border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-ring" />
              AI-Powered Analysis
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-3">
              Optimize Your Resume for{' '}
              <span className="text-primary">Any Job Role</span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              Upload your resume to get an ATS score, skill gap analysis, job role predictions,
              and personalized career recommendations — all in one dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Upload */}
        <ResumeUpload
          onTextExtracted={handleTextExtracted}
          extractedText={resumeText}
          fileName={fileName}
        />

        {/* Two-column grid for ATS + Prediction */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ATSScoreSection
            resumeText={resumeText}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
          />
          <JobRolePrediction resumeText={resumeText} />
        </div>

        {/* Skill Gap */}
        <SkillGapAnalysis
          resumeText={resumeText}
          selectedRole={selectedRole}
          jobRoles={jobRoles as JobRole[]}
          onMissingSkills={handleMissingSkills}
        />

        {/* Two-column grid for Recommendations + Improvements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CareerRecommendations
            missingSkills={missingSkills}
            hasResume={!!resumeText}
            hasRole={!!selectedRole}
          />
          <ResumeImprovements resumeText={resumeText} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/20 mt-8">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                <img
                  src="/assets/generated/resume-icon.dim_128x128.png"
                  alt=""
                  className="h-3.5 w-3.5 object-contain"
                />
              </div>
              <span className="font-medium text-foreground">ResumeAI Analyzer</span>
              <span>·</span>
              <span>© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>Built with</span>
              <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
              <span>using</span>
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline underline-offset-2"
              >
                caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
