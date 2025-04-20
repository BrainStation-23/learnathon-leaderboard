
import { Plus, Edit, Trash2, FileText, Info, Code, User, Settings } from "lucide-react";

export function getActionIcon(action: string) {
  switch(action.toLowerCase()) {
    case 'create':
      return <Plus className="h-4 w-4 text-green-500" />;
    case 'update':
      return <Edit className="h-4 w-4 text-amber-500" />;
    case 'delete':
      return <Trash2 className="h-4 w-4 text-red-500" />;
    case 'read':
      return <FileText className="h-4 w-4 text-blue-500" />;
    default:
      return <Info className="h-4 w-4 text-gray-500" />;
  }
}

export function getEntityIcon(entityType: string) {
  switch(entityType.toLowerCase()) {
    case 'repository':
      return <Code className="h-4 w-4" />;
    case 'user':
      return <User className="h-4 w-4" />;
    case 'configuration':
      return <Settings className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}
