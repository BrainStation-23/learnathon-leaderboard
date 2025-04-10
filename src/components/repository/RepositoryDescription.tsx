
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface RepositoryDescriptionProps {
  description?: string;
}

export const RepositoryDescription: React.FC<RepositoryDescriptionProps> = ({ description }) => {
  return (
    <Card className="mb-6 bg-muted/30 border-0 shadow-sm">
      <CardContent className="p-4">
        <p className="text-muted-foreground">
          {description || "No description available"}
        </p>
      </CardContent>
    </Card>
  );
};
