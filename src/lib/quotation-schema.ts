import { z } from "zod";

export const quoteItemSchema = z.object({
  description: z.string().trim().min(1).max(300),
  quantity: z.number().finite().positive().max(100000),
  rate: z.number().finite().nonnegative().max(1_000_000_000),
});

export const generatedQuoteSchema = z.object({
  title: z.string().trim().min(1).max(160),
  items: z.array(quoteItemSchema).min(1).max(30),
  terms: z.string().max(2000),
  notes: z.string().max(2000),
});

export const generateQuoteRequestSchema = z.object({
  notes: z.string().trim().min(10).max(8000),
  currency: z.literal("INR").default("INR"),
});

export type GeneratedQuote = z.infer<typeof generatedQuoteSchema>;
