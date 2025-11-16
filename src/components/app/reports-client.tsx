
'use client';

import { useState, useMemo } from 'react';
import type { Member, Transaction, InsurancePayment, InsurancePolicy } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { placeholderImages } from '@/lib/placeholder-images';
import { generateMemberReport } from '@/ai/flows/generate-member-report';
import { Loader2, User } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Input } from '../ui/input';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { GROUP_ID } from '@/lib/data';

interface MemberReportCardProps {
  member: Member;
  transactions: Transaction[];
  insurancePayments: InsurancePayment[];
  policies: InsurancePolicy[];
}

function MemberReportCard({ member, transactions, insurancePayments, policies }: MemberReportCardProps) {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const userAvatar = placeholderImages.find((p) => p.id === 'avatar-1');

  const memberTransactions = useMemo(
    () => transactions.filter((t) => t.memberId === member.id),
    [transactions, member.id]
  );
  
  const memberInsurance = useMemo(() => {
    const currentMonthKey = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
    return policies.map(policy => {
        const payment = insurancePayments.find(p => p.memberId === member.id && p.policyId === policy.id);
        const status = payment?.payments[currentMonthKey] || 'Unpaid';
        return { policyName: policy.name, status };
    });
  }, [insurancePayments, policies, member.id]);


  const getReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      const input = {
        memberName: member.name,
        transactions: memberTransactions.map(t => ({
            date: new Date(t.date).toISOString().split('T')[0],
            description: t.description,
            amount: t.amount,
            type: t.type,
            category: t.category,
        })),
        insurancePayments: memberInsurance,
      };
      const result = await generateMemberReport(input);
      setReport(result.report);
    } catch (error) {
      setReport('Could not generate a report at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalContributions = useMemo(() => {
    return memberTransactions
      .filter(t => t.type === 'Income' && t.category === 'Contribution')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [memberTransactions]);


  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-4">
        {userAvatar ? (
            <Avatar>
                <AvatarImage src={userAvatar.imageUrl} alt={member.name} data-ai-hint={userAvatar.imageHint} />
                <AvatarFallback><User /></AvatarFallback>
            </Avatar>
        ) : (
            <Avatar>
                <AvatarFallback><User /></AvatarFallback>
            </Avatar>
        )}
        <div className="flex-1">
          <CardTitle>{member.name}</CardTitle>
          <CardDescription>
            <Badge variant={member.status === 'Active' ? 'default' : 'outline'} className={member.status === 'Active' ? "bg-green-100 text-green-800" : ""}>{member.status}</Badge>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <h4 className="font-semibold text-sm mb-2">AI-Generated Summary</h4>
            {report && <p className="text-sm text-muted-foreground">{report}</p>}
            {isLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Generating...</div>}
            {!report && !isLoading && (
                <Button onClick={getReport} size="sm">Generate Report</Button>
            )}
        </div>
         <div>
            <h4 className="font-semibold text-sm mb-2">Key Metrics</h4>
            <div className="text-sm space-y-1">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Contributions:</span>
                    <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(totalContributions)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Recent Transactions:</span>
                    <span className="font-medium">{memberTransactions.length}</span>
                </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

function useAllInsurancePayments(policies: InsurancePolicy[]) {
    const firestore = useFirestore();

    const paymentQueries = useMemoFirebase(() => {
        if (!firestore || !policies) return [];
        return policies.map(policy => {
            const path = `groups/${GROUP_ID}/insurancePolicies/${policy.id}/payments`;
            return {
                query: query(collection(firestore, path)),
                path
            };
        });
    }, [firestore, policies]);

    const results = paymentQueries.map(({ query, path }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useCollection<InsurancePayment>(query, path);
    });

    const allPayments = useMemo(() => {
        return results.flatMap(result => result.data || []);
    }, [results]);

    const isLoading = results.some(result => result.isLoading);

    return { data: allPayments, isLoading };
}

interface ReportsClientProps {
  policies: InsurancePolicy[];
}

export default function ReportsClient({ policies }: ReportsClientProps) {
  const [filter, setFilter] = useState('');
  const firestore = useFirestore();

  const membersPath = `groups/${GROUP_ID}/members`;
  const transactionsPath = `groups/${GROUP_ID}/transactions`;

  const membersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, membersPath);
  }, [firestore]);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, transactionsPath);
  }, [firestore]);

  const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersQuery, membersPath);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery, transactionsPath);
  const { data: allPayments, isLoading: isLoadingInsurance } = useAllInsurancePayments(policies);


  const activeMembers = useMemo(() => {
    if (!members) return [];
    return members
      .filter((m) => m.status === 'Active')
      .filter(m => m.name.toLowerCase().includes(filter.toLowerCase()));
  }, [members, filter]);

  if (isLoadingMembers || isLoadingTransactions || isLoadingInsurance) {
      return (
         <div className="space-y-4">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Member Reports</h1>
                    <p className="text-muted-foreground">Generate AI-powered financial report cards for your members.</p>
                </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Card key={i}><CardHeader><CardTitle><div className="h-6 w-32 bg-muted rounded-md animate-pulse"/></CardTitle></CardHeader><CardContent className="space-y-4"><div className="h-10 w-full bg-muted rounded-md animate-pulse"/><div className="h-10 w-full bg-muted rounded-md animate-pulse"/></CardContent></Card>)}
            </div>
         </div>
      )
  }

  return (
    <div className="space-y-4">
       <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Member Reports</h1>
            <p className="text-muted-foreground">Generate AI-powered financial report cards for your members.</p>
        </div>
        <Input 
            placeholder="Filter members by name..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {activeMembers.map((member) => (
          <Link key={member.id} href={`/dashboard/members#${member.name.replace(/\s+/g, '-')}`} className="no-underline">
            <MemberReportCard
              member={member}
              transactions={transactions || []}
              insurancePayments={allPayments || []}
              policies={policies}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
