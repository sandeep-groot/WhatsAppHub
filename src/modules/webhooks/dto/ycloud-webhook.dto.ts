import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// ─── Shared Sub-Schemas ───────────────────────────────────────────────────────

const customerProfileSchema = z
  .object({
    name: z.string().optional(),
    username: z.string().optional(),
  })
  .passthrough();

const messageContextSchema = z
  .object({
    from: z.string().optional(),
    id: z.string().optional(),
    message_id: z.string().optional(),
  })
  .passthrough();

const messageTextSchema = z
  .object({
    body: z.string().optional(),
  })
  .passthrough();

// ─── whatsappInboundMessage ───────────────────────────────────────────────────

const whatsappInboundMessageSchema = z
  .object({
    id: z.string().optional(),
    wamid: z.string().optional(),
    wabaId: z.string().optional(),
    from: z.string().optional(),
    fromUserId: z.string().optional(),
    fromParentUserId: z.string().optional(),
    customerProfile: customerProfileSchema.optional(),
    to: z.string().optional(),
    /** Present for group messages */
    groupId: z.string().optional(),
    sendTime: z.string().optional(),
    type: z.string().optional(),
    text: messageTextSchema.optional(),
    context: messageContextSchema.optional(),
  })
  .passthrough();

// ─── whatsappMessage ─────────────────────────────────────────────────────────

const whatsappMessageTemplateLanguageSchema = z
  .object({
    code: z.string().optional(),
    policy: z.string().optional(),
  })
  .passthrough();

const whatsappMessageTemplateSchema = z
  .object({
    name: z.string().optional(),
    language: whatsappMessageTemplateLanguageSchema.optional(),
  })
  .passthrough();

const whatsappMessageConversationSchema = z
  .object({
    id: z.string().optional(),
    type: z.string().optional(),
    originType: z.string().optional(),
    expireTime: z.string().optional(),
  })
  .passthrough();

const whatsappMessageSchema = z
  .object({
    id: z.string().optional(),
    wamid: z.string().optional(),
    wabaId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    /** Outbound: recipient user id */
    recipientUserId: z.string().optional(),
    parentRecipientUserId: z.string().optional(),
    /** SMB history / echoes: destination user id */
    toUserId: z.string().optional(),
    toParentUserId: z.string().optional(),
    customerProfile: customerProfileSchema.optional(),
    status: z.string().optional(),
    type: z.string().optional(),
    template: whatsappMessageTemplateSchema.optional(),
    conversation: whatsappMessageConversationSchema.optional(),
    regionCode: z.string().optional(),
    pricingCategory: z.string().optional(),
    totalPrice: z.number().optional(),
    currency: z.string().optional(),
    createTime: z.string().optional(),
    sendTime: z.string().optional(),
    deliverTime: z.string().optional(),
    readTime: z.string().optional(),
    externalId: z.string().optional(),
    bizType: z.string().optional(),
    text: messageTextSchema.optional(),
    context: messageContextSchema.optional(),
  })
  .passthrough();

// ─── whatsappPhoneNumber ──────────────────────────────────────────────────────

const whatsappPhoneNumberSchema = z
  .object({
    phoneNumber: z.string().optional(),
    displayPhoneNumber: z.string().optional(),
    wabaId: z.string().optional(),
    status: z.string().optional(),
    // name_updated
    decision: z.string().optional(),
    requestedVerifiedName: z.string().optional(),
    rejectionReason: z.string().optional(),
    // business_username_updated
    businessUsername: z.string().optional(),
    businessUsernameStatus: z.string().optional(),
    businessUsernameUpdatedAt: z.string().optional(),
    // quality_updated
    qualityRating: z.string().optional(),
    messagingLimit: z.string().optional(),
    whatsappBusinessManagerMessagingLimit: z.string().optional(),
    qualityUpdateEvent: z.string().optional(),
  })
  .passthrough();

// ─── whatsappBusinessAccount ─────────────────────────────────────────────────

const businessAccountRestrictionSchema = z
  .object({
    restrictionType: z.string().optional(),
    expiration: z.string().optional(),
  })
  .passthrough();

const whatsappBusinessAccountSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    // business_account.updated
    accountReviewStatus: z.string().optional(),
    updateEvent: z.string().optional(),
    restrictions: z.array(businessAccountRestrictionSchema).optional(),
    banState: z.string().optional(),
    banDate: z.string().optional(),
    violationType: z.string().optional(),
  })
  .passthrough();

// ─── whatsappTemplate ────────────────────────────────────────────────────────

const whatsappTemplateSchema = z
  .object({
    wabaId: z.string().optional(),
    name: z.string().optional(),
    language: z.string().optional(),
    category: z.string().optional(),
    // category_updated
    previousCategory: z.string().optional(),
    // quality_updated / reviewed
    status: z.string().optional(),
    qualityRating: z.string().optional(),
    // reviewed
    reason: z.string().optional(),
    createTime: z.string().optional(),
    updateTime: z.string().optional(),
    statusUpdateEvent: z.string().optional(),
  })
  .passthrough();

// ─── whatsappPayment ─────────────────────────────────────────────────────────

const paymentTransactionAmountSchema = z
  .object({
    value: z.number().optional(),
    offset: z.number().optional(),
  })
  .passthrough();

const paymentTransactionErrorSchema = z
  .object({
    code: z.string().optional(),
    reason: z.string().optional(),
  })
  .passthrough();

const paymentTransactionSchema = z
  .object({
    id: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    createdTimestamp: z.number().optional(),
    updatedTimestamp: z.number().optional(),
    amount: paymentTransactionAmountSchema.optional(),
    currency: z.string().optional(),
    methodType: z.string().optional(),
    error: paymentTransactionErrorSchema.optional(),
  })
  .passthrough();

const whatsappPaymentSchema = z
  .object({
    wabaId: z.string().optional(),
    referenceId: z.string().optional(),
    status: z.string().optional(),
    transactions: z.array(paymentTransactionSchema).optional(),
  })
  .passthrough();

// ─── contact events ───────────────────────────────────────────────────────────

const contactCreatedSchema = z
  .object({
    id: z.string().optional(),
    nickName: z.string().optional(),
    realName: z.string().optional(),
    phoneNumber: z.string().optional(),
    countryCode: z.string().optional(),
    countryName: z.string().optional(),
    email: z.string().optional(),
    sourceType: z.string().optional(),
    sourceId: z.string().optional(),
    sourceUrl: z.string().optional(),
    lastSeen: z.string().optional(),
    lastConnectedNumber: z.string().optional(),
    ownerEmail: z.string().optional(),
    tags: z.array(z.string()).optional(),
    createTime: z.string().optional(),
    updateTime: z.string().optional(),
    blocked: z.boolean().optional(),
    customAttributes: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

const contactDeletedSchema = z
  .object({
    id: z.string().optional(),
    nickName: z.string().optional(),
    phoneNumber: z.string().optional(),
    updateTime: z.string().optional(),
  })
  .passthrough();

const unsubscriberChangedSchema = z
  .object({
    id: z.string().optional(),
    phoneNumber: z.string().optional(),
    source: z.string().optional(),
    updateTime: z.string().optional(),
  })
  .passthrough();

const changedAttributeValueSchema = z
  .object({
    oldValue: z.unknown().optional(),
    newValue: z.unknown().optional(),
    extra: z.array(z.record(z.string(), z.unknown())).optional(),
  })
  .passthrough();

const contactAttributesChangedSchema = z
  .object({
    id: z.string().optional(),
    updateTime: z.string().optional(),
    changedAttributes: z
      .record(z.string(), changedAttributeValueSchema)
      .optional(),
  })
  .passthrough();

// ─── whatsappSmbAppStateSync ──────────────────────────────────────────────────

const smbContactSchema = z
  .object({
    fullName: z.string().optional(),
    firstName: z.string().optional(),
    phoneNumber: z.string().optional(),
    userId: z.string().optional(),
    parentUserId: z.string().optional(),
    username: z.string().optional(),
  })
  .passthrough();

const smbStateSyncEntrySchema = z
  .object({
    contact: smbContactSchema.optional(),
    action: z.string().optional(),
    timestamp: z.number().optional(),
  })
  .passthrough();

const whatsappSmbAppStateSyncSchema = z
  .object({
    wabaId: z.string().optional(),
    phoneNumber: z.string().optional(),
    stateSync: z.array(smbStateSyncEntrySchema).optional(),
  })
  .passthrough();

// ─── whatsappUserPreference ───────────────────────────────────────────────────

const whatsappUserPreferenceSchema = z
  .object({
    wabaId: z.string().optional(),
    businessPhoneNumber: z.string().optional(),
    businessPhoneId: z.string().optional(),
    contactName: z.string().optional(),
    contactPhoneNumber: z.string().optional(),
    userId: z.string().optional(),
    parentUserId: z.string().optional(),
    detail: z.string().optional(),
    category: z.string().optional(),
    value: z.string().optional(),
    timestamp: z.number().optional(),
  })
  .passthrough();

// ─── Root webhook schema ──────────────────────────────────────────────────────

export const ycloudWebhookSchema = z
  .object({
    id: z.string().optional().meta({ example: 'evt_djeIQXaQPQyUcRFi' }),
    type: z.string().meta({ example: 'whatsapp.inbound_message.received' }),
    apiVersion: z.string().optional().meta({ example: 'v2' }),
    createTime: z.string().optional(),

    // ── inbound / SMB history (inbound variant) ──
    whatsappInboundMessage: whatsappInboundMessageSchema.optional(),

    // ── outbound status updates / SMB history (outbound) / SMB echoes ──
    whatsappMessage: whatsappMessageSchema.optional(),

    // ── phone number events ──
    whatsappPhoneNumber: whatsappPhoneNumberSchema.optional(),

    // ── business account events ──
    whatsappBusinessAccount: whatsappBusinessAccountSchema.optional(),

    // ── template events ──
    whatsappTemplate: whatsappTemplateSchema.optional(),

    // ── payment events ──
    whatsappPayment: whatsappPaymentSchema.optional(),

    // ── contact events ──
    contactCreated: contactCreatedSchema.optional(),
    contactDeleted: contactDeletedSchema.optional(),
    unsubscriberChanged: unsubscriberChangedSchema.optional(),
    contactAttributesChanged: contactAttributesChangedSchema.optional(),

    // ── SMB app state sync ──
    whatsappSmbAppStateSync: whatsappSmbAppStateSyncSchema.optional(),

    // ── user preferences ──
    whatsappUserPreference: whatsappUserPreferenceSchema.optional(),
  })
  .passthrough()
  .meta({ id: 'YCloudWebhookDto' });

export class YCloudWebhookDto extends createZodDto(ycloudWebhookSchema) {}

export type YCloudWebhookInput = z.infer<typeof ycloudWebhookSchema>;
