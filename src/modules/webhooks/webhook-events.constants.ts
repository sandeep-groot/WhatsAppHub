export const YCLOUD_WEBHOOK_EVENTS = [
  'whatsapp.business_account.deleted',
  'whatsapp.business_account.reviewed',
  'whatsapp.business_account.updated',
  'whatsapp.flow.status_change',
  'whatsapp.inbound_message.received',
  'whatsapp.message.updated',
  'whatsapp.payment.updated',
  'whatsapp.phone_number.deleted',
  'whatsapp.phone_number.name_updated',
  'whatsapp.phone_number.quality_updated',
  'whatsapp.smb.app.state.sync',
  'whatsapp.smb.history',
  'whatsapp.smb.message.echoes',
  'whatsapp.template.category_updated',
  'whatsapp.template.quality_updated',
  'whatsapp.template.reviewed',
  'whatsapp.user.preferences',
] as const;

export type YCloudWebhookEventType = (typeof YCLOUD_WEBHOOK_EVENTS)[number];
