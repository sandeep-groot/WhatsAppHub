export const YCLOUD_WEBHOOK_EVENTS = [
  // Business account
  'whatsapp.business_account.deleted',
  'whatsapp.business_account.reviewed',
  'whatsapp.business_account.updated',
  // Flow
  'whatsapp.flow.status_change',
  // Inbound messages
  'whatsapp.inbound_message.received',
  // Outbound message status
  'whatsapp.message.updated',
  // Payment
  'whatsapp.payment.updated',
  // Phone number
  'whatsapp.phone_number.deleted',
  'whatsapp.phone_number.business_username_updated',
  'whatsapp.phone_number.name_updated',
  'whatsapp.phone_number.quality_updated',
  // SMB
  'whatsapp.smb.app.state.sync',
  'whatsapp.smb.history',
  'whatsapp.smb.message.echoes',
  // Templates
  'whatsapp.template.category_updated',
  'whatsapp.template.quality_updated',
  'whatsapp.template.reviewed',
  // User preferences
  'whatsapp.user.preferences',
  // Contacts
  'contact.created',
  'contact.deleted',
  'contact.attributes_changed',
  'contact.unsubscribe.created',
  'contact.unsubscribe.deleted',
] as const;

export type YCloudWebhookEventType = (typeof YCLOUD_WEBHOOK_EVENTS)[number];

/** Static catalogue used to seed the WebhookEventType table. */
export const WEBHOOK_EVENT_CATALOGUE: {
  type: YCloudWebhookEventType;
  label: string;
  category: string;
  description: string;
}[] = [
  // ── Business account ──────────────────────────────────────────────────────
  {
    type: 'whatsapp.business_account.deleted',
    label: 'Business Account Deleted',
    category: 'Business Account',
    description: 'Fired when a WhatsApp Business Account is deleted.',
  },
  {
    type: 'whatsapp.business_account.reviewed',
    label: 'Business Account Reviewed',
    category: 'Business Account',
    description: 'Fired when a Business Account review completes.',
  },
  {
    type: 'whatsapp.business_account.updated',
    label: 'Business Account Updated',
    category: 'Business Account',
    description:
      'Fired when account details change (review status, ban, restrictions).',
  },
  // ── Flow ─────────────────────────────────────────────────────────────────
  {
    type: 'whatsapp.flow.status_change',
    label: 'Flow Status Changed',
    category: 'Flow',
    description: 'Fired when a WhatsApp Flow changes status.',
  },
  // ── Messages ─────────────────────────────────────────────────────────────
  {
    type: 'whatsapp.inbound_message.received',
    label: 'Inbound Message Received',
    category: 'Messages',
    description: 'Fired when a customer sends a message to your number.',
  },
  {
    type: 'whatsapp.message.updated',
    label: 'Message Status Updated',
    category: 'Messages',
    description:
      'Fired when an outbound message status changes (sent, delivered, read).',
  },
  // ── Payment ───────────────────────────────────────────────────────────────
  {
    type: 'whatsapp.payment.updated',
    label: 'Payment Updated',
    category: 'Payment',
    description: 'Fired when a WhatsApp payment transaction status changes.',
  },
  // ── Phone number ─────────────────────────────────────────────────────────
  {
    type: 'whatsapp.phone_number.deleted',
    label: 'Phone Number Deleted',
    category: 'Phone Number',
    description: 'Fired when a phone number is removed from the WABA.',
  },
  {
    type: 'whatsapp.phone_number.business_username_updated',
    label: 'Phone Number Business Username Updated',
    category: 'Phone Number',
    description: 'Fired when the business username for a phone number changes.',
  },
  {
    type: 'whatsapp.phone_number.name_updated',
    label: 'Phone Number Name Updated',
    category: 'Phone Number',
    description:
      'Fired when the verified display name for a number is reviewed.',
  },
  {
    type: 'whatsapp.phone_number.quality_updated',
    label: 'Phone Number Quality Updated',
    category: 'Phone Number',
    description:
      'Fired when the quality rating or messaging limit of a number changes.',
  },
  // ── SMB ──────────────────────────────────────────────────────────────────
  {
    type: 'whatsapp.smb.app.state.sync',
    label: 'SMB App State Sync',
    category: 'SMB',
    description:
      'Fired when contact additions/removals sync from the WhatsApp SMB app.',
  },
  {
    type: 'whatsapp.smb.history',
    label: 'SMB Message History',
    category: 'SMB',
    description: 'Fired to replay historical messages from the SMB app.',
  },
  {
    type: 'whatsapp.smb.message.echoes',
    label: 'SMB Message Echoes',
    category: 'SMB',
    description:
      'Fired when outbound messages sent from the SMB app are echoed.',
  },
  // ── Templates ────────────────────────────────────────────────────────────
  {
    type: 'whatsapp.template.category_updated',
    label: 'Template Category Updated',
    category: 'Templates',
    description: 'Fired when Meta reassigns a template to a different category.',
  },
  {
    type: 'whatsapp.template.quality_updated',
    label: 'Template Quality Updated',
    category: 'Templates',
    description: 'Fired when the quality rating of a template changes.',
  },
  {
    type: 'whatsapp.template.reviewed',
    label: 'Template Reviewed',
    category: 'Templates',
    description:
      'Fired when Meta approves or rejects a message template submission.',
  },
  // ── User preferences ─────────────────────────────────────────────────────
  {
    type: 'whatsapp.user.preferences',
    label: 'User Preferences Updated',
    category: 'User Preferences',
    description:
      'Fired when a customer opts in or out of a messaging category.',
  },
  // ── Contacts ─────────────────────────────────────────────────────────────
  {
    type: 'contact.created',
    label: 'Contact Created',
    category: 'Contacts',
    description: 'Fired when a new contact is created.',
  },
  {
    type: 'contact.deleted',
    label: 'Contact Deleted',
    category: 'Contacts',
    description: 'Fired when a contact is deleted.',
  },
  {
    type: 'contact.attributes_changed',
    label: 'Contact Attributes Changed',
    category: 'Contacts',
    description: 'Fired when one or more attributes of a contact change.',
  },
  {
    type: 'contact.unsubscribe.created',
    label: 'Contact Unsubscribed',
    category: 'Contacts',
    description: 'Fired when a contact opts out of messaging.',
  },
  {
    type: 'contact.unsubscribe.deleted',
    label: 'Contact Resubscribed',
    category: 'Contacts',
    description: 'Fired when a contact opts back in to messaging.',
  },
];
