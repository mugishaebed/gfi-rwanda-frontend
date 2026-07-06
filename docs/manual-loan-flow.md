# Manual Loan Flow — Guide for Loan Officers & General Managers

This guide walks through a **manual loan** (a loan an officer creates on behalf of a
client) from creation to closure. It explains who does what at each step, what status
the loan is in, and a few rules that often cause confusion.

> **Roles**
> - **Loan Officer (LO):** creates applications, does the first review, records repayments.
> - **General Manager (GM):** gives final approval, releases the money, and approves repayments.

---

## The journey at a glance

```
①  LO creates application        →  Awaiting officer review
②  LO reviews & sends up         →  Awaiting GM approval
③  GM approves + disburses        →  Active   (money released)
④  LO records a repayment        →  Repayment Pending
⑤  GM approves the repayment      →  balances update
⑥  Repeat ④–⑤ until paid off     →  Outstanding principal = 0  (Closed)
```

---

## Step ① — Create the application (Loan Officer)

**Where:** Loans → **+ New Application**

The officer captures the full request:
- Client, amount, purpose, and **sector**
- Loan terms (interest rate **per month**, term in months, dates)
- Collateral details
- Repayment plan / schedule
- Fees and any supporting documents

When submitted, the loan enters **Awaiting officer review**.

> 💡 The interest rate is entered **per month**. A 7% rate means 7% *each month*, not per year.

---

## Step ② — Officer review (Loan Officer)

**Where:** Loans → *Manual Requests*

The officer checks the application and either:
- **Approves** it → the loan moves to **Awaiting GM approval**, or
- **Rejects** it → the loan is **Rejected** and stops here.

This is a first-line check before it reaches the GM.

---

## Step ③ — GM approval & disbursement (General Manager)

**Where:** Loans → *Awaiting Review*

The GM reviews the loan and, to approve, **enters the disbursed amount and the
disbursement date**. On approval the loan becomes **Active** and the money is released.

> ⚠️ **Two rules that matter here:**
> 1. **Separation of duties** — the GM who approves a loan **cannot be the same person who
>    created it**. If you created the loan, a *different* GM must approve it.
> 2. **A manual loan only counts as "disbursed" at this moment.** The disbursement date is
>    set when the GM approves. Before that, the loan shows **0** in "disbursed" figures and
>    dashboards — which is correct, because no money has gone out yet.

If the GM rejects, the loan is **Rejected** and stops here.

---

## Step ④ — Record a repayment (Loan Officer)

**Where:** Loans (an Active loan) → **+ Repayment**, or the Repayments page

When the client pays, the officer records the amount. Every repayment is split into:
- **Principal** — capital being paid back (this is what reduces the balance), and
- **Interest** — the lender's earnings on the loan.

The system **suggests the split** as soon as you type the amount; the officer can adjust it.

> 💡 Rules for the split (the form checks these for you):
> - Principal + Interest must **equal** the amount paid.
> - Neither can be negative.
> - Principal can't be **more than the outstanding principal** still owed.

A new repayment is **Pending** — it is not final yet.

---

## Step ⑤ — Approve the repayment (General Manager)

**Where:** Repayments

The GM reviews the repayment and **approves** it. The approval screen shows the **amount
being approved** and its principal/interest split, plus the projected balance.

**Balances only move when the GM approves.** On approval:
- **Outstanding principal** drops by the **principal** portion (not the full amount — interest doesn't reduce principal).
- Interest received and principal recovered totals update.

If the GM rejects, no balances change.

---

## Step ⑥ — Closing the loan

Repeat steps ④–⑤ for each payment. The loan is **fully paid** when the
**outstanding principal reaches 0**.

---

## Quick reference — what each term means

| Term | Meaning |
|---|---|
| **Outstanding principal** | The capital still owed. Interest is **not** included here. Loan is paid off when this is 0. |
| **Disbursed** | Money actually released to the client. Set at **GM approval** for manual loans. |
| **Principal (on a repayment)** | The part of a payment that reduces the outstanding principal. |
| **Interest (on a repayment)** | The lender's earnings portion of a payment. Does not reduce principal. |
| **Pending** | Recorded but not yet approved — no balances have moved. |

## Common questions

- **"Disbursed this month shows 0 — is that wrong?"** Not necessarily. It only counts loans
  whose **disbursement date** falls in the current period. A loan disbursed last month won't
  appear in this month's figure; the **All-time** total on the same card always reflects the full book.
- **"I approved a loan I created and it didn't work."** By design — a different GM must approve
  loans you originated.
- **"The repayment I recorded didn't change the balance."** It's **Pending** until a GM
  approves it. Balances move only on approval.
