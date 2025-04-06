
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AuthRequiredCardProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonLink?: string;
}

export default function AuthRequiredCard({
  title,
  description,
  buttonText,
  buttonLink
}: AuthRequiredCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      {buttonText && buttonLink && (
        <CardContent>
          <Button onClick={() => navigate(buttonLink)}>
            {buttonText}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
