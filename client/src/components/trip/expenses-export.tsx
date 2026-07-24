import { format } from "date-fns";

export interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  paidBy: number;
  paidByName?: string;
  createdAt: string;
  splitMethod: string;
  settled?: boolean;
}

export interface Trip {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
}

/**
 * Export expenses to CSV format
 */
export function exportExpensesToCSV(expenses: Expense[], trip: Trip): void {
  const headers = [
    "Date",
    "Description",
    "Category",
    "Amount",
    "Paid By",
    "Split Method",
    "Status",
  ];

  const rows = expenses.map((exp) => [
    format(new Date(exp.createdAt), "yyyy-MM-dd"),
    `"${exp.description.replace(/"/g, '""')}"`, // Escape quotes
    exp.category,
    exp.amount.toFixed(2),
    exp.paidByName || `User ${exp.paidBy}`,
    exp.splitMethod,
    exp.settled ? "Settled" : "Unsettled",
  ]);

  const csvContent = [
    `Trip: ${trip.title}`,
    `Destination: ${trip.destination}`,
    `Dates: ${format(new Date(trip.startDate), "MMM d, yyyy")} - ${format(new Date(trip.endDate), "MMM d, yyyy")}`,
    `Total Expenses: $${expenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}`,
    "",
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  downloadFile(
    csvContent,
    `${trip.title.replace(/\s+/g, "-")}-expenses.csv`,
    "text/csv"
  );
}

/**
 * Export expenses to PDF format
 */
export function exportExpensesToPDF(expenses: Expense[], trip: Trip): void {
  // Create HTML content for PDF
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${trip.title} - Expense Report</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    h1 {
      color: #1e40af;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .trip-info {
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }
    .summary {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background: white;
      border-radius: 6px;
    }
    .summary-label {
      font-weight: 600;
      color: #374151;
    }
    .summary-value {
      font-weight: 700;
      color: #1e40af;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #3b82f6;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 13px;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    tr:hover {
      background: #f9fafb;
    }
    .amount {
      text-align: right;
      font-weight: 600;
    }
    .category-breakdown {
      margin: 30px 0;
    }
    .category-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      border-left: 4px solid #3b82f6;
      background: #f9fafb;
      margin-bottom: 8px;
      border-radius: 4px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }
    @media print {
      body {
        margin: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${trip.title} - Expense Report</h1>
    <div class="trip-info">
      <div><strong>Destination:</strong> ${trip.destination}</div>
      <div><strong>Trip Dates:</strong> ${format(new Date(trip.startDate), "MMM d, yyyy")} - ${format(new Date(trip.endDate), "MMM d, yyyy")}</div>
      <div><strong>Report Generated:</strong> ${format(new Date(), "MMM d, yyyy 'at' h:mm a")}</div>
    </div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <span class="summary-label">Total Expenses</span>
      <span class="summary-value">$${totalAmount.toFixed(2)}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Number of Expenses</span>
      <span class="summary-value">${expenses.length}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Settled Expenses</span>
      <span class="summary-value">${expenses.filter(e => e.settled).length}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Pending Settlement</span>
      <span class="summary-value">${expenses.filter(e => !e.settled).length}</span>
    </div>
  </div>

  <h2>Expense Details</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Category</th>
        <th>Paid By</th>
        <th class="amount">Amount</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${expenses
        .map(
          (exp) => `
        <tr>
          <td>${format(new Date(exp.createdAt), "MMM d, yyyy")}</td>
          <td>${escapeHtml(exp.description)}</td>
          <td>${capitalize(exp.category)}</td>
          <td>${escapeHtml(exp.paidByName || `User ${exp.paidBy}`)}</td>
          <td class="amount">$${exp.amount.toFixed(2)}</td>
          <td>${exp.settled ? "✓ Settled" : "⏳ Pending"}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="category-breakdown">
    <h2>Spending by Category</h2>
    ${Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(
        ([category, amount]) => `
      <div class="category-item">
        <span>${capitalize(category)}</span>
        <strong>$${amount.toFixed(2)} (${((amount / totalAmount) * 100).toFixed(1)}%)</strong>
      </div>
    `
      )
      .join("")}
  </div>

  <div class="footer">
    <p>Generated by TripSync | ${format(new Date(), "MMM d, yyyy")}</p>
  </div>
</body>
</html>
  `;

  // Convert HTML to PDF using print functionality
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      // Close window after printing (optional)
      // printWindow.close();
    };
  } else {
    // Fallback: download as HTML if popup is blocked
    downloadFile(
      htmlContent,
      `${trip.title.replace(/\s+/g, "-")}-expenses.html`,
      "text/html"
    );
    alert("Popup blocked. HTML version downloaded instead. Open and print to save as PDF.");
  }
}

/**
 * Helper function to download a file
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Capitalize first letter
 */
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).replace(/_/g, " ");
}
