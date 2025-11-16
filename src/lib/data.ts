
export type Member = {
  id: string;
  name: string;
  phone: string;
  joinDate: Date;
  status: 'Active' | 'Inactive';
};

export type Transaction = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: 'Contribution' | 'Late Fee' | 'Project' | 'Social Fund' | 'Operational';
  memberId?: string;
  memberName?: string;
};

export type InsurancePolicy = {
  id: 'nhif' | 'private';
  name: string;
  monthlyPremium: number;
};

export type InsurancePayment = {
  memberId: string;
  policyId: 'nhif' | 'private';
  payments: Record<string, 'Paid' | 'Unpaid' | 'Waived'>; // Key is month "YYYY-MM"
};

export type Group = {
  id: string;
  name: string;
  currency: string;
};


// Hardcoded Group ID for the entire application
export const GROUP_ID = 'primary-group';

const members: Member[] = [
  { id: 'MEM001', name: 'Alice Johnson', phone: '+254712345678', joinDate: new Date('2023-01-15'), status: 'Active' },
  { id: 'MEM002', name: 'Bob Williams', phone: '+254712345679', joinDate: new Date('2023-02-20'), status: 'Active' },
  { id: 'MEM003', name: 'Charlie Brown', phone: '+254712345680', joinDate: new Date('2023-03-10'), status: 'Active' },
  { id: 'MEM004', name: 'Diana Miller', phone: '+254712345681', joinDate: new Date('2023-04-05'), status: 'Active' },
  { id: 'MEM005', name: 'Ethan Davis', phone: '+254712345682', joinDate: new Date('2023-05-12'), status: 'Inactive' },
  { id: 'MEM006', name: 'Fiona Garcia', phone: '+254712345683', joinDate: new Date('2023-06-18'), status: 'Active' },
  { id: 'MEM007', name: 'George Rodriguez', phone: '+254712345684', joinDate: new Date('2023-07-22'), status: 'Active' },
];

const transactions: Transaction[] = [
  { id: 'TRN001', date: new Date('2024-07-01'), description: 'July Contribution', amount: 5000, type: 'Income', category: 'Contribution', memberId: 'MEM001', memberName: 'Alice Johnson' },
  { id: 'TRN002', date: new Date('2024-07-01'), description: 'July Contribution', amount: 5000, type: 'Income', category: 'Contribution', memberId: 'MEM002', memberName: 'Bob Williams' },
  { id: 'TRN003', date: new Date('2024-07-03'), description: 'Stationery purchase', amount: -1500, type: 'Expense', category: 'Operational' },
  { id: 'TRN004', date: new Date('2024-07-05'), description: 'Late Fee payment', amount: 200, type: 'Income', category: 'Late Fee', memberId: 'MEM003', memberName: 'Charlie Brown' },
  { id: 'TRN005', date: new Date('2024-06-15'), description: 'Social Fund Payout', amount: -10000, type: 'Expense', category: 'Social Fund' },
  { id: 'TRN006', date: new Date('2024-06-01'), description: 'June Contribution', amount: 35000, type: 'Income', category: 'Contribution', memberName: 'All Members' },
  { id: 'TRN007', date: new Date('2024-05-20'), description: 'Project Alpha Supplies', amount: -50000, type: 'Expense', category: 'Project' },
];

export const insurancePolicies: InsurancePolicy[] = [
    { id: 'nhif', name: 'NHIF', monthlyPremium: 500 },
    { id: 'private', name: 'Private Cover', monthlyPremium: 2000 },
];

const currentYear = new Date().getFullYear();
const months = Array.from({ length: 12 }, (_, i) => `${currentYear}-${(i + 1).toString().padStart(2, '0')}`);

const insurancePayments: InsurancePayment[] = members.map(member => {
    const payments: Record<string, 'Paid' | 'Unpaid' | 'Waived'> = {};
    months.forEach(month => {
        if (member.status === 'Inactive' || new Date(month) > new Date()) {
            payments[month] = 'Waived';
        } else {
            payments[month] = Math.random() > 0.3 ? 'Paid' : 'Unpaid';
        }
    });
    return {
        memberId: member.id,
        policyId: 'nhif',
        payments,
    };
});

// Simulate some data for a second policy
members.slice(0, 3).forEach(member => {
    const payments: Record<string, 'Paid' | 'Unpaid' | 'Waived'> = {};
    months.forEach(month => {
         if (new Date(month) > new Date()) {
            payments[month] = 'Waived';
        } else {
            payments[month] = Math.random() > 0.2 ? 'Paid' : 'Unpaid';
        }
    });
    insurancePayments.push({
        memberId: member.id,
        policyId: 'private',
        payments,
    })
});

export const getMembers = async (): Promise<Member[]> => {
  return new Promise(resolve => setTimeout(() => resolve(members), 50));
};

export const getTransactions = async (): Promise<Transaction[]> => {
  return new Promise(resolve => setTimeout(() => resolve(transactions), 50));
};

export const getInsurancePayments = async (): Promise<InsurancePayment[]> => {
    return new Promise(resolve => setTimeout(() => resolve(insurancePayments), 50));
};

export const getFinancialOverview = async () => {
    const now = new Date();
    const last30Days = new Date(now.setDate(now.getDate() - 30));
    
    const recentTransactions = transactions.filter(t => t.date >= last30Days);

    const income = recentTransactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = recentTransactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);

    const chartData = [
        { month: 'May', income: 40000, expenses: -20000 },
        { month: 'Jun', income: 35000, expenses: -10000 },
        { month: 'Jul', income: 10200, expenses: -1500 },
    ];

    return {
        income,
        expenses,
        netChange: income + expenses,
        totalBalance: totalIncome + totalExpenses,
        chartData
    };
}
