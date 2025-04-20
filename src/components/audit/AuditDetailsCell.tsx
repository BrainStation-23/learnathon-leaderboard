
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface AuditDetailsCellProps {
  details: Record<string, any> | null;
  entityId: string | null;
}

export function AuditDetailsCell({ details, entityId }: AuditDetailsCellProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!details) {
    return <span className="text-muted-foreground text-sm">No details available</span>;
  }
  
  // Format the entity ID for display
  const formattedEntityId = entityId ? 
    <span className="text-sm font-mono bg-muted px-1 py-0.5 rounded">{entityId.substring(0, 8)}</span> : 
    null;
    
  // Process details for better display
  const processedDetails = processDetails(details);
    
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-center gap-2">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="p-0 h-6 w-6">
            <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            <span className="sr-only">Toggle details</span>
          </Button>
        </CollapsibleTrigger>
        
        <div className="flex items-center gap-2 text-sm">
          {getDetailsSummary(details)}
          {formattedEntityId && <span>ID: {formattedEntityId}</span>}
        </div>
      </div>
      
      <CollapsibleContent className="pt-2 pl-6">
        <div className="text-sm bg-muted/50 p-2 rounded border overflow-x-auto">
          <pre className="whitespace-pre-wrap">{JSON.stringify(processedDetails, null, 2)}</pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Helper function to create a summarized version of the details
function getDetailsSummary(details: Record<string, any>): React.ReactNode {
  const summaryFields = ['name', 'title', 'id', 'status', 'action', 'reason'];
  
  // Look for meaningful fields to display
  for (const field of summaryFields) {
    if (details[field] && typeof details[field] === 'string') {
      return <span className="font-medium">{details[field]}</span>;
    }
  }
  
  // Count the number of keys
  const keyCount = Object.keys(details).length;
  return <span>{keyCount} field{keyCount !== 1 ? 's' : ''} modified</span>;
}

// Helper function to process and clean up details for display
function processDetails(details: Record<string, any>): Record<string, any> {
  // For now just return the original details
  // In a real app, you might want to format dates, convert IDs to names, etc.
  return details;
}
