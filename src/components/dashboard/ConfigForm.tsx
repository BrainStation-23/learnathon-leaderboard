
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useConfig } from "@/context/ConfigContext";
import { ProjectConfig } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const configSchema = z.object({
  github_org: z.string().min(1, "GitHub organization name is required"),
  github_pat: z.string().min(1, "GitHub Personal Access Token is required"),
  sonarcloud_org: z.string().min(1, "SonarCloud organization slug is required"),
});

export default function ConfigForm() {
  const { config, updateConfig } = useConfig();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      github_org: config.github_org || "",
      github_pat: config.github_pat || "",
      sonarcloud_org: config.sonarcloud_org || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof configSchema>) => {
    setIsSubmitting(true);
    try {
      const newConfig: ProjectConfig = {
        github_org: values.github_org,
        github_pat: values.github_pat,
        sonarcloud_org: values.sonarcloud_org,
      };
      
      await updateConfig(newConfig);
      
      toast({
        title: "Configuration saved",
        description: "Your dashboard configuration has been updated.",
      });
    } catch (error) {
      console.error("Failed to save configuration:", error);
      toast({
        title: "Configuration error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Dashboard Configuration</CardTitle>
        <CardDescription>
          Configure your GitHub organization and SonarCloud integration
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="github_org"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Organization</FormLabel>
                  <FormControl>
                    <Input placeholder="your-github-org" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of your GitHub organization
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="github_pat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Personal Access Token (PAT)</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="ghp_xxxxxxxxxxxx" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Token needs read access to repositories, commits, and contributors
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sonarcloud_org"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SonarCloud Organization Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="your-sonar-org" {...field} />
                  </FormControl>
                  <FormDescription className="space-y-1">
                    <p>The key/slug of your SonarCloud organization (found in the URL or organization settings).</p>
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p>Your SonarCloud organization slug is the lowercase value in your SonarCloud URL:</p>
                        <p className="font-mono text-xs mt-1">https://sonarcloud.io/organizations/<strong>your-org-slug</strong>/projects</p>
                        <p className="mt-1">Note that project keys may have different formats, such as:</p>
                        <p className="font-mono text-xs mt-1">Your-Org-Slug_repository-name</p>
                        <p className="mt-1 text-xs">The system will try different format variations to find your projects.</p>
                      </AlertDescription>
                    </Alert>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Configuration"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
