import List "mo:core/List";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

actor {
  type JobRole = {
    title : Text;
    description : Text;
    requiredSkills : [Text];
  };

  module JobRole {
    public func compare(r1 : JobRole, r2 : JobRole) : Order.Order {
      Text.compare(r1.title, r2.title);
    };
  };

  type CareerRecommendation = {
    projects : [Text];
    certifications : [Text];
    tools : [Text];
  };

  type SkillGapAnalysis = {
    matchedSkills : [Text];
    missingSkills : [Text];
    gapPercentage : Float;
  };

  type JobRolePrediction = {
    role : Text;
    confidence : Float;
    explanation : Text;
  };

  type JobRolePredictionApiResponse = {
    role : Text;
    confidence : Float;
  };

  type JobRolePredictionApiResponses = [JobRolePredictionApiResponse];

  type ResumeImprovementSuggestion = {
    weakVerb : Text;
    strongAlternatives : [Text];
  };

  let jobRoles = List.fromArray<JobRole>([
    {
      title = "Front-End Developer";
      description = "Build UIs using JavaScript frameworks like React, Angular, and Vue.";
      requiredSkills = ["JavaScript", "HTML", "CSS", "React", "Angular"];
    },
    {
      title = "Back-End Developer";
      description = "Develop server-side logic and APIs using Node.js, Python, or Java.";
      requiredSkills = ["Node.js", "Python", "Java", "SQL", "APIs"];
    },
    {
      title = "Data Scientist";
      description = "Analyze data and build machine learning models using Python or R.";
      requiredSkills = ["Python", "R", "SQL", "Machine Learning", "Statistics"];
    },
  ]);

  let resumeTemplates = Map.empty<Text, [Text]>();
  let actionVerbSuggestions = Map.empty<Text, ResumeImprovementSuggestion>();

  public query ({ caller }) func getJobRoles() : async [JobRole] {
    jobRoles.toArray().sort();
  };

  public query ({ caller }) func getCertifications() : async [Text] {
    [
      "AWS Certified Developer",
      "Google Professional Cloud Architect",
      "Certified Kubernetes Administrator",
    ];
  };

  public query ({ caller }) func getResumeTemplates() : async [Text] {
    ["Front-End Developer", "Back-End Developer", "Data Scientist"];
  };

  public query ({ caller }) func getResumeTemplate(role : Text) : async [Text] {
    switch (resumeTemplates.get(role)) {
      case (?template) { template };
      case (null) { Runtime.trap("Resume template not found") };
    };
  };

  public query ({ caller }) func getActionVerbSuggestions() : async [(Text, ResumeImprovementSuggestion)] {
    let entries = actionVerbSuggestions.entries();
    entries.toArray();
  };

  public shared ({ caller }) func addResumeTemplate(role : Text, template : [Text]) : async () {
    resumeTemplates.add(role, template);
  };
};
