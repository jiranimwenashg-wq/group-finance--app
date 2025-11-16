import { config } from 'dotenv';
config();

import '@/ai/flows/generate-financial-summary.ts';
import '@/ai/flows/parse-mpesa-sms.ts';
import '@/ai/flows/query-constitution.ts';
import '@/ai/flows/generate-member-report.ts';
