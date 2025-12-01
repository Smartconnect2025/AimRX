/**
 * Core Services Module Exports
 *
 * This file exports all services from the core services module,
 * making imports cleaner throughout the application.
 */

// Export CometChat services
export { cometchatService, CometChatHelpers } from "./chat/cometchatService";
export { ClientChatService } from "@/features/chat/services/clientChatService";
export * from "./chat/utils";

// Export CRM services
export { klaviyoService } from "./crm/klaviyoService";
export { crmEventTriggers } from "./crm/crmEventTriggers";

// Account Management Services
export * from "./account-management";
