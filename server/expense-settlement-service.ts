import { eq, and } from 'drizzle-orm';
import { getDb } from './db';
import { expenses, tripMembers } from '@shared/schema';

/**
 * Settlement calculation service using greedy debt simplification algorithm.
 *
 * Algorithm:
 * 1. Calculate net balance for each person (total paid - total owed)
 * 2. Separate into creditors (positive) and debtors (negative)
 * 3. Match largest debtor with largest creditor iteratively
 * 4. Minimize number of transactions
 */

export interface Settlement {
  from: string; // User ID who owes
  to: string; // User ID who is owed
  amount: number; // Amount in cents
  fromName: string; // User display name
  toName: string; // User display name
}

export interface UserBalance {
  userId: string;
  userName: string;
  netBalance: number; // Positive = owed money, Negative = owes money
  totalPaid: number;
  totalOwed: number;
}

/**
 * Calculate who owes whom for a trip using greedy debt simplification.
 * Returns minimal list of settlements needed.
 */
export async function calculateSettlements(tripId: string): Promise<{
  settlements: Settlement[];
  balances: UserBalance[];
}> {
  const db = getDb();

  // Get all unsettled expenses for this trip
  const tripExpenses = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.tripId, tripId), eq(expenses.isSettled, false)));

  // Get all trip members with user details
  const members = await db.query.tripMembers.findMany({
    where: eq(tripMembers.tripId, tripId),
    with: {
      user: true,
    },
  });

  // Build a map of userId -> userName for easy lookup
  const userMap = new Map<string, string>();
  members.forEach((member: any) => {
    if (member.user) {
      userMap.set(member.userId, member.user.fullName || member.user.email);
    }
  });

  // Calculate net balance for each user
  const balanceMap = new Map<string, UserBalance>();

  // Initialize all members with zero balance
  members.forEach((member) => {
    balanceMap.set(member.userId, {
      userId: member.userId,
      userName: userMap.get(member.userId) || 'Unknown User',
      netBalance: 0,
      totalPaid: 0,
      totalOwed: 0,
    });
  });

  // Process each expense
  for (const expense of tripExpenses) {
    const payer = expense.paidByUserId;
    const totalAmount = expense.amount;
    const splitAmong = expense.splitAmong as string[];
    const numPeople = splitAmong.length;

    if (numPeople === 0) continue;

    // Calculate equal split per person (using floor for integer division)
    const amountPerPerson = Math.floor(totalAmount / numPeople);

    // Handle remainder (distribute to first person to avoid floating point issues)
    const remainder = totalAmount - amountPerPerson * numPeople;

    // Payer paid the total amount
    const payerBalance = balanceMap.get(payer);
    if (payerBalance) {
      payerBalance.totalPaid += totalAmount;
      payerBalance.netBalance += totalAmount;
    }

    // Each person in splitAmong owes their share
    splitAmong.forEach((userId, index) => {
      const userBalance = balanceMap.get(userId);
      if (userBalance) {
        // First person gets the remainder
        const owedAmount = amountPerPerson + (index === 0 ? remainder : 0);
        userBalance.totalOwed += owedAmount;
        userBalance.netBalance -= owedAmount;
      }
    });
  }

  // Convert to array and separate creditors from debtors
  const balances = Array.from(balanceMap.values());
  const creditors = balances
    .filter((b) => b.netBalance > 0)
    .sort((a, b) => b.netBalance - a.netBalance);
  const debtors = balances
    .filter((b) => b.netBalance < 0)
    .sort((a, b) => a.netBalance - b.netBalance);

  // Greedy debt simplification algorithm
  const settlements: Settlement[] = [];
  let i = 0; // Index for creditors
  let j = 0; // Index for debtors

  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];

    const amountOwed = Math.abs(debtor.netBalance);
    const amountToReceive = creditor.netBalance;

    // Transfer the minimum of what's owed and what's to receive
    const transferAmount = Math.min(amountOwed, amountToReceive);

    settlements.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: transferAmount,
      fromName: debtor.userName,
      toName: creditor.userName,
    });

    // Update balances
    creditor.netBalance -= transferAmount;
    debtor.netBalance += transferAmount;

    // Move to next creditor if fully paid
    if (creditor.netBalance === 0) {
      i++;
    }

    // Move to next debtor if fully settled
    if (debtor.netBalance === 0) {
      j++;
    }
  }

  return {
    settlements,
    balances,
  };
}

/**
 * Mark an expense as settled.
 */
export async function markExpenseSettled(expenseId: string): Promise<void> {
  const db = getDb();
  await db.update(expenses).set({ isSettled: true }).where(eq(expenses.id, expenseId));
}

/**
 * Mark all expenses for a trip as settled.
 */
export async function markAllExpensesSettled(tripId: string): Promise<void> {
  const db = getDb();
  await db
    .update(expenses)
    .set({ isSettled: true })
    .where(and(eq(expenses.tripId, tripId), eq(expenses.isSettled, false)));
}

/**
 * Get settlement status for a specific pair of users.
 */
export async function getUserPairBalance(
  tripId: string,
  userId1: string,
  userId2: string
): Promise<{
  user1OwesUser2: number;
  user2OwesUser1: number;
  netAmount: number;
  netDirection: 'user1_owes' | 'user2_owes' | 'settled';
}> {
  const { settlements } = await calculateSettlements(tripId);

  let user1OwesUser2 = 0;
  let user2OwesUser1 = 0;

  settlements.forEach((s) => {
    if (s.from === userId1 && s.to === userId2) {
      user1OwesUser2 += s.amount;
    } else if (s.from === userId2 && s.to === userId1) {
      user2OwesUser1 += s.amount;
    }
  });

  const netAmount = Math.abs(user1OwesUser2 - user2OwesUser1);
  let netDirection: 'user1_owes' | 'user2_owes' | 'settled';

  if (user1OwesUser2 > user2OwesUser1) {
    netDirection = 'user1_owes';
  } else if (user2OwesUser1 > user1OwesUser2) {
    netDirection = 'user2_owes';
  } else {
    netDirection = 'settled';
  }

  return {
    user1OwesUser2,
    user2OwesUser1,
    netAmount,
    netDirection,
  };
}
