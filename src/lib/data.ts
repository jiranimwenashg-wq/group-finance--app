
export type Member = {
  id: string;
  name: string;
  phone: string;
  joinDate: Date;
  status: 'Active' | 'Inactive';
  groupId: string;
};

export type Transaction = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: 'Contribution' | 'Late Fee' | 'Project' | 'Social Fund' | 'Operational' | 'Last Respect';
  memberId?: string;
  memberName?: string;
  groupId: string;
};

export type InsurancePolicy = {
  id: string;
  name: string;
  premiumAmount: number;
  groupId: string;
};

export type InsurancePayment = {
  id: string;
  memberId: string;
  policyId: string;
  payments: Record<string, 'Paid' | 'Unpaid' | 'Waived'>; // Key is month "YYYY-MM"
  groupId: string;
};

export type Group = {
  id: string;
  name: string;
  currency: string;
};

// Hardcoded Group ID for the entire application
export const GROUP_ID = process.env.NEXT_PUBLIC_GROUP_ID!;
