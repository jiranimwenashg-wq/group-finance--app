

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
  id: 'nhif' | 'private';
  name: string;
  monthlyPremium: number;
};

export type InsurancePayment = {
  id: string;
  memberId: string;
  policyId: 'nhif' | 'private';
  payments: Record<string, 'Paid' | 'Unpaid' | 'Waived'>; // Key is month "YYYY-MM"
  groupId: string;
};

export type Group = {
  id: string;
  name: string;
  currency: string;
};

// Hardcoded Group ID for the entire application
export const GROUP_ID = 'primary-group';

export const insurancePolicies: InsurancePolicy[] = [
    { id: 'nhif', name: 'NHIF', monthlyPremium: 500 },
    { id: 'private', name: 'Private Cover', monthlyPremium: 2000 },
];
