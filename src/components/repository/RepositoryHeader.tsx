
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code, Shield, ExternalLink } from "lucide-react";
import { GitHubRepoData, SonarCloudData } from "@/types";

interface RepositoryHeaderProps {
  repository: GitHubRepoData;
  sonarData?: SonarCloudData;
  onBackClick: () => void;
}

export const RepositoryHeader: React.FC<RepositoryHeaderProps> = ({ 
  repository, 
  sonarData, 
  onBackClick 
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={onBackClick} 
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <h1 className="text-2xl font-bold">{repository.name}</h1>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2" asChild>
          <a href={repository.html_url} target="_blank" rel="noopener noreferrer">
            <Code size={16} />
            View Code
          </a>
        </Button>
        {sonarData && (
          <Button variant="outline" className="gap-2" asChild>
            <a 
              href={`https://sonarcloud.io/project/overview?id=${sonarData.project_key}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Shield size={16} />
              SonarCloud
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};
