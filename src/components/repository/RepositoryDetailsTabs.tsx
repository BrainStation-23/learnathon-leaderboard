
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GitHubRepoData, SonarCloudData, GitHubSecurityIssue } from "@/types";
import { RepositoryOverviewTab } from "./tabs/RepositoryOverviewTab";
import { RepositoryCodeQualityTab } from "./tabs/RepositoryCodeQualityTab";
import { RepositorySecurityTab } from "./tabs/RepositorySecurityTab";

interface RepositoryDetailsTabsProps {
  repository: GitHubRepoData;
  sonarData?: SonarCloudData;
  securityIssues?: GitHubSecurityIssue[];
  filteredContributorsList: string[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const RepositoryDetailsTabs: React.FC<RepositoryDetailsTabsProps> = ({
  repository,
  sonarData,
  securityIssues,
  filteredContributorsList,
  activeTab,
  onTabChange
}) => {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid grid-cols-3 mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="code-quality">Code Quality</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <RepositoryOverviewTab 
          repository={repository}
          filteredContributorsList={filteredContributorsList}
        />
      </TabsContent>
      
      <TabsContent value="code-quality">
        <RepositoryCodeQualityTab sonarData={sonarData} />
      </TabsContent>
      
      <TabsContent value="security">
        <RepositorySecurityTab 
          repository={repository} 
          securityIssues={securityIssues} 
        />
      </TabsContent>
    </Tabs>
  );
};
