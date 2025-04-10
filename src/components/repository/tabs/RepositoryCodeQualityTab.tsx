
import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SonarCloudData } from "@/types";
import {
  BadgeCheck,
  FileCode2,
  CheckCircle2,
  Bug,
  ShieldX,
  FileWarning,
  Gauge,
  ExternalLink,
  Shield,
  GitCompareArrows,
  BarChart3
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from "recharts";

interface RepositoryCodeQualityTabProps {
  sonarData?: SonarCloudData;
}

export const RepositoryCodeQualityTab: React.FC<RepositoryCodeQualityTabProps> = ({
  sonarData
}) => {
  const prepareMetricsData = () => {
    if (!sonarData?.metrics) return [];
    
    const { bugs, vulnerabilities, code_smells } = sonarData.metrics;
    
    return [
      { name: 'Bugs', value: bugs || 0, fill: '#FF8042' },
      { name: 'Vulnerabilities', value: vulnerabilities || 0, fill: '#FFBB28' },
      { name: 'Code Smells', value: code_smells || 0, fill: '#00C49F' }
    ];
  };

  const metricsData = prepareMetricsData();

  if (!sonarData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SonarCloud Metrics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Shield size={40} className="text-muted-foreground/20 mb-4" />
          <p className="text-lg font-medium mb-2">No SonarCloud data available</p>
          <p className="text-muted-foreground max-w-md">
            This repository doesn't have SonarCloud integration or no data has been collected yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">SonarCloud Metrics Overview</CardTitle>
              <CardDescription>
                Code quality analysis from SonarCloud
              </CardDescription>
            </div>
            <div className="rounded-full bg-blue-100 p-2">
              <BadgeCheck size={18} className="text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <div className="bg-muted/40 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <FileCode2 size={20} className="text-blue-500" />
                </div>
                <div className="text-2xl font-bold">
                  {sonarData.metrics.lines_of_code?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Lines of Code</p>
              </div>
              
              <div className="bg-muted/40 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle2 size={20} className="text-green-500" />
                </div>
                <div className="text-2xl font-bold">
                  {`${sonarData.metrics.coverage?.toFixed(1) || "0"}%`}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Code Coverage</p>
              </div>
              
              <div className="bg-muted/40 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <Bug size={20} className="text-orange-500" />
                </div>
                <div className="text-2xl font-bold">
                  {sonarData.metrics.bugs?.toString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Bugs</p>
              </div>
              
              <div className="bg-muted/40 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <ShieldX size={20} className="text-red-500" />
                </div>
                <div className="text-2xl font-bold">
                  {sonarData.metrics.vulnerabilities?.toString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Vulnerabilities</p>
              </div>
              
              <div className="bg-muted/40 p-4 rounded-lg text-center">
                <div className="flex items-center justify-center mb-2">
                  <FileWarning size={20} className="text-yellow-500" />
                </div>
                <div className="text-2xl font-bold">
                  {sonarData.metrics.code_smells?.toString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Code Smells</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 size={18} className="text-purple-500" />
              Code Issues Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {metricsData.length > 0 && metricsData.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background border rounded-md shadow-md p-2">
                            <p className="font-medium">{`${payload[0].name}: ${payload[0].value}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="value" name="Count">
                    {metricsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <FileCode2 size={40} className="text-muted-foreground/20 mb-2" />
                <p className="text-muted-foreground">
                  No code issues data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitCompareArrows size={18} className="text-indigo-500" />
              Technical Debt
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <div className="h-32 w-32 rounded-full border-8 border-muted flex items-center justify-center mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {sonarData.metrics.technical_debt || "0"}
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Estimated time to fix all code smells</p>
            </div>
            
            <div className="mt-6 w-full">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Gauge size={16} className="text-blue-500" />
                  Complexity:
                </span>
                <span className="font-medium">{sonarData.metrics.complexity || "N/A"}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full text-xs" asChild>
              <a 
                href={`https://sonarcloud.io/project/issues?id=${sonarData.project_key}&resolved=false`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                View All Issues <ExternalLink size={12} className="ml-1" />
              </a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
