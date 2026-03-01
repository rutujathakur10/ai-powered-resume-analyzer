import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface JobRole {
    title: string;
    description: string;
    requiredSkills: Array<string>;
}
export interface ResumeImprovementSuggestion {
    strongAlternatives: Array<string>;
    weakVerb: string;
}
export interface backendInterface {
    addResumeTemplate(role: string, template: Array<string>): Promise<void>;
    getActionVerbSuggestions(): Promise<Array<[string, ResumeImprovementSuggestion]>>;
    getCertifications(): Promise<Array<string>>;
    getJobRoles(): Promise<Array<JobRole>>;
    getResumeTemplate(role: string): Promise<Array<string>>;
    getResumeTemplates(): Promise<Array<string>>;
}
