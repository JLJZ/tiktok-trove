const { z } = require('zod');

const Participant = z.object({
  id: z.string().optional(),
  handle: z.string(),
  role: z.enum(['MAIN_CREATOR','COLLABORATOR','RIGHTS_HOLDER','PLATFORM','OTHER']),
  walletId: z.string().optional()
});

const PSARuleSplitRef = z.object({
  role: z.string().optional(),
  participantId: z.string().optional()
});

const PSARuleSplit = z.object({
  ref: PSARuleSplitRef,
  share: z.number()
});

const PSARules = z.object({
  splitType: z.enum(['PERCENTAGE','WEIGHT']),
  preDeductions: z.object({
    platformFeePercent: z.number().min(0).max(100).default(0),
    taxWithholdingPercent: z.number().min(0).max(100).default(0),
    reservePercent: z.number().min(0).max(100).default(0),
  }).partial().default({}),
  splits: z.array(PSARuleSplit).min(1),
  overrides: z.array(z.object({
    stream: z.enum(['ADS','GIFTS','TIPS','SUBSCRIPTIONS','SHOP_COMMISSION','MUSIC_ROYALTY','OTHER']),
    rule: z.object({
      splitType: z.enum(['PERCENTAGE','WEIGHT']).default('PERCENTAGE'),
      splits: z.array(PSARuleSplit).min(1)
    })
  })).optional()
});

const PSACreate = z.object({
  contentId: z.string(),
  title: z.string().optional(),
  cycle: z.enum(['PER_EVENT','DAILY','WEEKLY','MONTHLY']),
  currency: z.string(),
  minPayoutCents: z.number().int().nonnegative().default(0).optional(),
  reservePercent: z.number().min(0).max(100).default(0).optional(),
  participants: z.array(Participant).min(1),
  rules: PSARules
});

const PSAUpdate = z.object({
  status: z.enum(['DRAFT','ACTIVE','SUSPENDED','ENDED']).optional(),
  cycle: z.enum(['PER_EVENT','DAILY','WEEKLY','MONTHLY']).optional(),
  currency: z.string().optional(),
  minPayoutCents: z.number().int().nonnegative().optional(),
  reservePercent: z.number().min(0).max(100).optional(),
  rules: PSARules.optional()
});

const RevenueEventCreate = z.object({
  psaId: z.string().optional(),
  contentId: z.string().optional(),
  stream: z.enum(['ADS','GIFTS','TIPS','SUBSCRIPTIONS','SHOP_COMMISSION','MUSIC_ROYALTY','OTHER']),
  amountCents: z.number().int().positive(),
  currency: z.string(),
  occurredAt: z.string(), // ISO date-time
  geo: z.object({ country: z.string().length(2) }).optional(),
  externalRef: z.string().optional()
});

const SettlementCreate = z.object({
  psaId: z.string(),
  period: z.object({
    start: z.string(),
    end: z.string()
  }),
  dryRun: z.boolean().default(false).optional()
});

module.exports = {
  Participant, PSACreate, PSAUpdate, RevenueEventCreate, SettlementCreate
};
