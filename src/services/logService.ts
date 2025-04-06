
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type LogLevel = 'info' | 'warning' | 'error';

export async function logToDatabase(
  action: string,
  entityType: string,
  details: Record<string, any>,
  userId?: string,
  entityId?: string
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      user_id: userId as any,
      action,
      entity_type: entityType,
      entity_id: entityId as any,
      details
    });
  } catch (error) {
    console.error("Failed to log to database:", error);
    // We don't throw here as we don't want logging failures to disrupt the application
  }
}

export function logToConsole(
  level: LogLevel,
  message: string,
  details?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  switch (level) {
    case 'info':
      console.info(formattedMessage, details || '');
      break;
    case 'warning':
      console.warn(formattedMessage, details || '');
      break;
    case 'error':
      console.error(formattedMessage, details || '');
      break;
  }
}

export const logger = {
  info: (message: string, details?: Record<string, any>, userId?: string, entityType?: string, entityId?: string) => {
    logToConsole('info', message, details);
    if (userId && entityType) {
      logToDatabase('info', entityType, { message, ...details }, userId, entityId);
    }
  },
  warn: (message: string, details?: Record<string, any>, userId?: string, entityType?: string, entityId?: string) => {
    logToConsole('warning', message, details);
    if (userId && entityType) {
      logToDatabase('warning', entityType, { message, ...details }, userId, entityId);
    }
  },
  error: (message: string, details?: Record<string, any>, userId?: string, entityType?: string, entityId?: string) => {
    logToConsole('error', message, details);
    if (userId && entityType) {
      logToDatabase('error', entityType, { message, ...details }, userId, entityId);
    }
  }
};
