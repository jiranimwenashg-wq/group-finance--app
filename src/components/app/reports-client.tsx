
'use client';

import { useState, useMemo } from 'react';
import type { Member, Transaction, InsurancePayment, InsurancePolicy } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { placeholderImages } from '@/lib/placeholder-images.json';
import { generateMemberReport } from '@/ai/flows/generate-member-report';
import { Loader2, User } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Input } from '../ui/input';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { GROUP_ID } from '@/lib/data';

interface MemberReportCardProps {
  member: Member;
  transactions: Transaction[];
  policies: InsurancePolicy[];
}

function MemberReportCard({ member, transactions, policies }: MemberReportCardProps) {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const userAvatar = placeholderImages.find((p) => p.id === 'avatar-1');
  const firestore = useFirestore();

  const memberTransactions = useMemo(
    () => transactions.filter((t) => t.memberId === member.id),
    [transactions, member.id]
  );

  const getReport = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
        const allPayments: InsurancePayment[] = [];
        if (firestore) {
           for (const p of policies) {
               const paymentsPath = `groups/${GROUP_ID}/insurancePolicies/${p.id}/payments`;
               const paymentsQuery = query(collection(firestore, paymentsPath));
               const querySnapshot = await getDocs(paymentsQuery);
               querySnapshot.forEach(doc => {
                   allPayments.push({ id: doc.id, ...doc.data() } as InsurancePayment);
               });
           }
        }

        const memberInsurance = policies.map(policy => {
            const currentMonthKey = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
            const payment = allPayments.find(p => p.memberId === member.id && p.policyId === policy.id);
            const status = payment?.payments[currentMonthKey] || 'Unpaid';
            return { policyName: policy.name, status };
        });

      const input = {
        memberName: member.name,
        transactions: memberTransactions.map(t => {
            const transactionDate = t.date instanceof Date ? t.date : (t.date as any).toDate();
            return {
                date: transactionDate.toISOString().split('T')[0],
                description: t.description,
                amount: t.amount,
                type: t.type,
                category: t.category,
            }
        }),
        insurancePayments: memberInsurance,
      };
      const result = await generateMemberReport(input);
      setReport(result.report);
    } catch (error) {
        console.error(error);
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
          <div className="text-sm text-muted-foreground">
            <Badge variant={member.status === 'Active' ? 'default' : 'outline'} className={member.status === 'Active' ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : ""}>{member.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
            <h4 className="font-semibold text-sm mb-2">AI-Generated Summary</h4>
            {report ? <p className="text-sm text-muted-foreground">{report}</p> : null}
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


export default function ReportsClient() {
  const [filter, setFilter] = useState('');
  const firestore = useFirestore();

  const policiesPath = `groups/${GROUP_ID}/insurancePolicies`;
  const policiesQuery = useMemoFirebase(() => {
      if(!firestore || !GROUP_ID) return null;
      return collection(firestore, policiesPath);
  }, [firestore]);
  const { data: policies, isLoading: isLoadingPolicies } = useCollection<InsurancePolicy>(policiesQuery, policiesPath);

  const membersPath = `groups/${GROUP_ID}/members`;
  const transactionsPath = `groups/${GROUP_ID}/transactions`;

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || !GROUP_ID) return null;
    return collection(firestore, membersPath);
  }, [firestore]);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !GROUP_ID) return null;
    return collection(firestore, transactionsPath);
  }, [firestore]);

  const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersQuery, membersPath);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsQuery, transactionsPath);


  const activeMembers = useMemo(() => {
    if (!members) return [];
    return members
      .filter((m) => m.status === 'Active')
      .filter(m => m.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a,b) => a.name.localeCompare(b.name));
  }, [members, filter]);

  if (isLoadingMembers || isLoadingTransactions || isLoadingPolicies) {
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
              policies={policies || []}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
