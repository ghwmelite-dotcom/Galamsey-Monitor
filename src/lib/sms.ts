import twilio from 'twilio';
import type { Incident, WaterQualityReading } from '@/types';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SMSOptions {
  to: string;
  message: string;
}

export interface SMSResult {
  success: boolean;
  sid?: string;
  error?: string;
}

export async function sendSMS(options: SMSOptions): Promise<SMSResult> {
  if (!client || !twilioPhoneNumber) {
    console.warn('SMS service not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.');
    return { success: false, error: 'SMS service not configured' };
  }

  // Ensure phone number is in E.164 format
  let phoneNumber = options.to.replace(/\s+/g, '');
  if (!phoneNumber.startsWith('+')) {
    // Assume Ghana number if not international
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '+233' + phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('233')) {
      phoneNumber = '+' + phoneNumber;
    } else {
      phoneNumber = '+233' + phoneNumber;
    }
  }

  try {
    const message = await client.messages.create({
      body: options.message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// SMS Templates (character-limited for SMS)
export function getNewIncidentSMS(incident: Incident): string {
  const typeLabels: Record<string, string> = {
    illegal_mining: 'Mining',
    water_pollution: 'Water',
    deforestation: 'Forest',
    land_degradation: 'Land',
  };

  return `GALAMSEY ALERT: ${incident.severity.toUpperCase()} ${typeLabels[incident.incident_type] || incident.incident_type} incident in ${incident.district}, ${incident.region}. ${incident.title.substring(0, 50)}${incident.title.length > 50 ? '...' : ''} Reply STOP to unsubscribe.`;
}

export function getStatusUpdateSMS(incident: Incident, oldStatus: string, newStatus: string): string {
  const statusLabels: Record<string, string> = {
    active: 'Active',
    investigating: 'Investigating',
    resolved: 'Resolved',
  };

  return `GALAMSEY UPDATE: Incident "${incident.title.substring(0, 30)}${incident.title.length > 30 ? '...' : ''}" status changed from ${statusLabels[oldStatus] || oldStatus} to ${statusLabels[newStatus] || newStatus}. Reply STOP to unsubscribe.`;
}

export function getWaterAlertSMS(reading: WaterQualityReading): string {
  return `WATER ALERT: ${reading.quality_status.toUpperCase()} water quality detected at ${reading.water_body_name}, ${reading.region}. Mercury: ${reading.mercury_level_ppb || 'N/A'}ppb, Arsenic: ${reading.arsenic_level_ppb || 'N/A'}ppb. Avoid contact! Reply STOP to unsubscribe.`;
}

export function getCriticalIncidentSMS(incident: Incident): string {
  return `CRITICAL ALERT: ${incident.title.substring(0, 60)}${incident.title.length > 60 ? '...' : ''} reported in ${incident.district}, ${incident.region}. Immediate action required. Contact: ${incident.contact_phone || 'N/A'}. Reply STOP to unsubscribe.`;
}

// Helper functions for sending specific SMS types
export async function sendNewIncidentSMS(to: string, incident: Incident): Promise<SMSResult> {
  return sendSMS({
    to,
    message: getNewIncidentSMS(incident),
  });
}

export async function sendStatusUpdateSMS(to: string, incident: Incident, oldStatus: string, newStatus: string): Promise<SMSResult> {
  return sendSMS({
    to,
    message: getStatusUpdateSMS(incident, oldStatus, newStatus),
  });
}

export async function sendWaterAlertSMS(to: string, reading: WaterQualityReading): Promise<SMSResult> {
  return sendSMS({
    to,
    message: getWaterAlertSMS(reading),
  });
}

export async function sendCriticalIncidentSMS(to: string, incident: Incident): Promise<SMSResult> {
  return sendSMS({
    to,
    message: getCriticalIncidentSMS(incident),
  });
}

// Parse incoming SMS commands
export interface SMSCommand {
  command: 'REPORT' | 'STATUS' | 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'HELP' | 'UNKNOWN';
  args: string[];
  raw: string;
}

export function parseSMSCommand(message: string): SMSCommand {
  const trimmed = message.trim().toUpperCase();
  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  switch (command) {
    case 'REPORT':
      // REPORT <lat> <lon> <type> <description>
      return { command: 'REPORT', args, raw: message };
    case 'STATUS':
      // STATUS <incident_id>
      return { command: 'STATUS', args, raw: message };
    case 'SUBSCRIBE':
      // SUBSCRIBE <region>
      return { command: 'SUBSCRIBE', args, raw: message };
    case 'UNSUBSCRIBE':
    case 'STOP':
      return { command: 'UNSUBSCRIBE', args, raw: message };
    case 'HELP':
    case '?':
      return { command: 'HELP', args, raw: message };
    default:
      return { command: 'UNKNOWN', args: [trimmed], raw: message };
  }
}

export function getHelpSMS(): string {
  return `GALAMSEY SMS Commands:
REPORT <lat> <lon> <type> <desc> - Report incident
STATUS <id> - Check incident status
SUBSCRIBE <region> - Get alerts for region
STOP - Unsubscribe from alerts
HELP - Show this message`;
}

export function getSubscriptionConfirmSMS(region: string): string {
  return `You are now subscribed to Galamsey alerts for ${region}. You will receive SMS notifications for new incidents and water quality alerts. Reply STOP to unsubscribe.`;
}

export function getUnsubscribeConfirmSMS(): string {
  return `You have been unsubscribed from Galamsey Monitor SMS alerts. Reply SUBSCRIBE <region> to re-subscribe.`;
}
