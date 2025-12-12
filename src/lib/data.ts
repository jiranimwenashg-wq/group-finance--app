
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
  category: 'Contribution' | 'Late Fee' | 'Project' | 'Social Fund' | 'Operational' | 'Last Respect' | 'Loan Repayment';
  memberId?: string;
  memberName?: string;
  groupId: string;
  loanId?: string;
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
  ownerId: string;
};

export type Loan = {
  id: string;
  groupId: string;
  memberId: string;
  memberName: string;
  principal: number;
  interestRate: number;
  balance: number;
  issueDate: Date;
  status: 'Active' | 'Paid Off';
  reason: string;
};


// Hardcoded Group ID for the entire application
export const GROUP_ID = "primary-group";

    