
import { Alert, AlertCircle, AlertDescription, AlertTitle } from "@/components/ui/alert";

type ErrorDisplayProps = {
  errors: string[];
};

export default function ErrorDisplay({ errors }: ErrorDisplayProps) {
  if (errors.length === 0) return null;
  
  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Warning</AlertTitle>
      <AlertDescription>
        <p className="mb-2">The following errors occurred during the refresh:</p>
        <ul className="list-disc pl-5 space-y-1">
          {errors.map((error, index) => (
            <li key={index} className="text-sm">{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
