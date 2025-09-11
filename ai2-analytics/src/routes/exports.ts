import express from 'express';
import { format } from 'date-fns';

const router = express.Router();

// Interface for transaction data (matching core app structure)
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  primaryType: 'expense' | 'income';
  isTaxDeductible: boolean;
  businessUsePercentage?: number;
  expenseType?: 'business' | 'employee';
  reference?: string;
  merchant?: string;
  category?: string;
  gstAmount?: number;
}

// Interface for travel data
interface Vehicle {
  id: string;
  registration: string;
  description: string;
  ownership: string;
  vehicleType: string;
  isActive: boolean;
}

interface Trip {
  id: string;
  vehicleId: string;
  tripDate: string;
  tripType: string;
  purpose: string;
  startOdometer: number;
  endOdometer: number;
  startLocation?: string;
  endLocation?: string;
  tripDetails: string;
  distanceKm: number;
  isMultipleTrips: boolean;
  isReturnJourney: boolean;
  totalKm: number;
  isLogbookTrip: boolean;
  notes?: string;
  vehicle: Vehicle;
}

// Interface for unlinked bill occurrence
interface UnlinkedBillOccurrence {
  id: string;
  billPatternId: string;
  billPatternName: string;
  dueDate: string;
  amount: number;
  frequency: string;
  category: string | null;
  isTaxDeductible: boolean;
  businessUsePercentage: number;
  expenseType: 'business' | 'employee';
  notes: string | null;
  isEstimated: boolean;
}

// Interface for export preview
interface ExportPreview {
  income: Transaction[];
  expenses: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  businessExpenses: number;
  employeeExpenses: number;
  trips: Trip[];
  vehicles: Vehicle[];
  totalTrips: number;
  totalDistance: number;
  unlinkedBills: UnlinkedBillOccurrence[];
  totalUnlinkedBills: number;
  unlinkedBillsAmount: number;
}

// Helper function to process transactions for ATO format (OPTIMIZED for large datasets)
function processTransactionsForATO(transactions: Transaction[], trips?: Trip[], vehicles?: Vehicle[], unlinkedBills?: UnlinkedBillOccurrence[]): ExportPreview {
  // PERFORMANCE OPTIMIZATION: Single pass through transactions to avoid multiple filters
  let totalIncome = 0;
  let totalExpenses = 0;
  let businessExpenses = 0;
  let employeeExpenses = 0;
  const income: Transaction[] = [];
  const expenses: Transaction[] = [];
  
  // Single loop through all transactions for better performance
  for (const t of transactions) {
    const amount = Math.abs(t.amount);
    
    if (t.primaryType === 'income' && (t.isTaxDeductible || t.expenseType === 'business')) {
      income.push(t);
      totalIncome += amount;
    } else if (t.primaryType === 'expense' && t.isTaxDeductible) {
      expenses.push(t);
      totalExpenses += amount;
      
      // Categorize expense types in the same loop
      if (t.expenseType === 'business' || !t.expenseType) {
        businessExpenses += amount;
      } else if (t.expenseType === 'employee') {
        employeeExpenses += amount;
      }
    }
  }

  const totalTrips = trips?.length || 0;
  const totalDistance = trips?.reduce((sum, t) => sum + t.totalKm, 0) || 0;

  // Process unlinked bills and include them in totals
  const processedUnlinkedBills = unlinkedBills || [];
  const totalUnlinkedBills = processedUnlinkedBills.length;
  const unlinkedBillsAmount = processedUnlinkedBills.reduce((sum, bill) => 
    sum + (bill.amount * bill.businessUsePercentage / 100), 0
  );

  // Add unlinked bills to the appropriate expense totals
  const totalExpensesWithUnlinked = totalExpenses + unlinkedBillsAmount;
  const businessExpensesWithUnlinked = businessExpenses + processedUnlinkedBills
    .filter(bill => bill.expenseType === 'business' || !bill.expenseType)
    .reduce((sum, bill) => sum + (bill.amount * bill.businessUsePercentage / 100), 0);
  const employeeExpensesWithUnlinked = employeeExpenses + processedUnlinkedBills
    .filter(bill => bill.expenseType === 'employee')
    .reduce((sum, bill) => sum + (bill.amount * bill.businessUsePercentage / 100), 0);

  return {
    income,
    expenses,
    totalIncome,
    totalExpenses: totalExpensesWithUnlinked, // Include unlinked bills in total
    businessExpenses: businessExpensesWithUnlinked, // Include unlinked bills in business expenses
    employeeExpenses: employeeExpensesWithUnlinked, // Include unlinked bills in employee expenses
    trips: trips || [],
    vehicles: vehicles || [],
    totalTrips,
    totalDistance,
    unlinkedBills: processedUnlinkedBills,
    totalUnlinkedBills,
    unlinkedBillsAmount,
  };
}

// Helper function to format date for ATO CSV
function formatDateForATO(dateString: string): string {
  try {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  } catch (error) {
    return dateString;
  }
}

// Helper function to generate ATO CSV content with travel data and unlinked bills (OPTIMIZED)
function generateATOCSV(transactions: Transaction[], trips: Trip[], vehicles: Vehicle[], startDate: string, endDate: string, unlinkedBills?: UnlinkedBillOccurrence[]): string {
  const processed = processTransactionsForATO(transactions, trips, vehicles, unlinkedBills);
  
  // PERFORMANCE FIX: Use array and join() instead of string concatenation
  const csvLines: string[] = [];
  
  // Header
  csvLines.push(`Date: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}`);
  csvLines.push(`ATO app - myDeductions`);
  csvLines.push('');
  
  // Income section
  csvLines.push(`Income`);
  csvLines.push(`Uploaded,Type,Status,Date,Amount,GST included,Description,Reference,Payment method,"Photo reference*"`);
  
  // Process income transactions
  for (const income of processed.income) {
    const amount = Math.abs(income.amount);
    const gst = income.gstAmount || (amount * 0.1); // Default 10% GST if not specified
    csvLines.push(`Not uploaded,Business,Completed,${formatDateForATO(income.date)},${amount.toFixed(2)},${gst.toFixed(2)},"${income.description}","${income.reference || ''}",,,`);
  }
  
  // Expenses section
  csvLines.push('');
  csvLines.push(`Expenses`);
  csvLines.push(`Uploaded,Type,Status,Date,Amount,"GST included*",Description,% Claimable,Expense type,Expense sub-type*,Vehicle*,Photo reference*`);
  
  // Process expense transactions
  for (const expense of processed.expenses) {
    const amount = Math.abs(expense.amount);
    const gst = expense.gstAmount || '';
    const percentage = expense.businessUsePercentage || 100;
    const type = expense.expenseType === 'employee' ? 'Employee' : 'Business';
    const subType = expense.expenseType === 'employee' ? 'Other work-related' : 'All other expenses';
    const subTypeDetail = expense.expenseType === 'employee' ? 'Other' : '';
    
    csvLines.push(`Not uploaded,${type},Completed,${formatDateForATO(expense.date)},${amount.toFixed(2)},${gst ? gst.toFixed(2) : ''},"${expense.description}",${percentage}%,"${subType}","${subTypeDetail}",,,`);
  }

  // Add unlinked bills as estimated expenses
  for (const bill of processed.unlinkedBills) {
    const amount = Math.abs(bill.amount);
    const percentage = bill.businessUsePercentage || 100;
    const type = bill.expenseType === 'employee' ? 'Employee' : 'Business';
    const subType = bill.expenseType === 'employee' ? 'Other work-related' : 'All other expenses';
    const subTypeDetail = bill.expenseType === 'employee' ? 'Other' : '';
    const description = `${bill.billPatternName} - ${bill.frequency} pattern occurrence (Not linked to bank transaction)`;
    
    csvLines.push(`Not uploaded,${type},Completed,${formatDateForATO(bill.dueDate)},${amount.toFixed(2)},,"${description}",${percentage}%,"${subType}","${subTypeDetail}",,,`);
  }
  
  // Trips section
  csvLines.push('');
  csvLines.push(`Trips`);
  csvLines.push(`Uploaded,Type,Status,Date,Vehicle,Purpose of trip,Start odometer*,End odometer*,Start location#,End location#,Trip details,Trip distance*,Record multiple trips*,Record the return journey*,Total Km,Logbook trip`);
  
  for (const trip of processed.trips) {
    const tripType = trip.tripType === 'BUSINESS' ? 'Business' : 'Employee';
    const multipleTrips = trip.isMultipleTrips ? '1' : '0';
    const returnJourney = trip.isReturnJourney ? 'Yes' : 'No';
    const logbookTrip = trip.isLogbookTrip ? 'Y' : 'N';
    
    csvLines.push(`Not uploaded,${tripType},Completed,${formatDateForATO(trip.tripDate)},${trip.vehicle.registration},${trip.purpose},${trip.startOdometer.toFixed(2)},${trip.endOdometer.toFixed(2)},${trip.startLocation || ''},${trip.endLocation || ''},"${trip.tripDetails}",${trip.distanceKm.toFixed(2)},${multipleTrips},${returnJourney},${trip.totalKm.toFixed(2)},${logbookTrip}`);
  }
  
  // Vehicles section
  csvLines.push('');
  csvLines.push(`Vehicles`);
  csvLines.push(`Registration,Description,Ownership,Vehicle type`);
  
  for (const vehicle of processed.vehicles) {
    const ownership = vehicle.ownership === 'OWNED' ? 'I own lease or hire-purchase' : 
                     vehicle.ownership === 'LEASED' ? 'Leased' : 
                     vehicle.ownership === 'HIRE_PURCHASE' ? 'Hire Purchase' : vehicle.ownership;
    
    csvLines.push(`${vehicle.registration},"${vehicle.description}",${ownership},${vehicle.vehicleType},`);
  }
  
  csvLines.push('');
  csvLines.push(`"* If applicable to expense or trip type."`);
  
  // PERFORMANCE FIX: Single join() operation instead of multiple string concatenations
  return csvLines.join('\n');
}

// Generate ATO myDeductions export with travel data
router.post('/api/analytics/export/ato-mydeductions', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { startDate, endDate, transactions, trips, vehicles, unlinkedBills } = req.body;
    
    if (!startDate || !endDate || !transactions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: startDate, endDate, transactions',
        timestamp: new Date().toISOString()
      });
    }

    // PERFORMANCE SAFEGUARD: Limit transaction processing to prevent timeouts
    const maxTransactions = 5000;
    const limitedTransactions = transactions.slice(0, maxTransactions);
    
    if (transactions.length > maxTransactions) {
      console.warn(`⚠️ Large dataset detected: ${transactions.length} transactions, limiting to ${maxTransactions} for performance`);
    }

    console.log(`🔄 Generating ATO CSV for ${limitedTransactions.length} transactions...`);
    
    // Generate CSV content using real transaction data, travel data, and unlinked bills
    const csvContent = generateATOCSV(limitedTransactions, trips || [], vehicles || [], startDate, endDate, unlinkedBills || []);
    const filename = `ATO_myDeductions_${format(new Date(startDate), 'yyyy-MM-dd')}_to_${format(new Date(endDate), 'yyyy-MM-dd')}.csv`;
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ ATO CSV generation completed in ${processingTime}ms`);

    res.json({
      success: true,
      data: {
        csvContent,
        filename,
        recordCount: limitedTransactions.length,
        totalRecords: transactions.length,
        tripCount: trips?.length || 0,
        vehicleCount: vehicles?.length || 0,
        unlinkedBillCount: unlinkedBills?.length || 0,
        preview: processTransactionsForATO(limitedTransactions, trips, vehicles, unlinkedBills),
        processingTimeMs: processingTime
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ ATO export error after ${processingTime}ms:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate ATO export',
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    });
  }
});

// Get export preview data (processes real transactions passed from frontend)
router.post('/api/analytics/export/preview', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { startDate, endDate, transactions, trips, vehicles, unlinkedBills } = req.body;
    
    if (!startDate || !endDate || !transactions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: startDate, endDate, transactions',
        timestamp: new Date().toISOString()
      });
    }

    // PERFORMANCE SAFEGUARD: Limit transaction processing to prevent timeouts
    const maxTransactions = 5000;
    const limitedTransactions = transactions.slice(0, maxTransactions);
    
    if (transactions.length > maxTransactions) {
      console.warn(`⚠️ Large dataset detected: ${transactions.length} transactions, limiting to ${maxTransactions} for performance`);
    }

    console.log(`🔄 Processing ${limitedTransactions.length} transactions for ATO export preview...`);
    
    // Process real transaction data for preview including unlinked bills
    const previewData = processTransactionsForATO(limitedTransactions, trips, vehicles, unlinkedBills);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ ATO export preview completed in ${processingTime}ms`);

    res.json({
      success: true,
      data: previewData,
      processingTimeMs: processingTime,
      totalTransactions: transactions.length,
      processedTransactions: limitedTransactions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`❌ Export preview error after ${processingTime}ms:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate export preview',
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    });
  }
});

// Get available export formats
router.get('/api/analytics/export/formats', (req, res) => {
  res.json({
    success: true,
    data: {
      formats: [
        {
          id: 'ato-mydeductions',
          name: 'ATO myDeductions',
          description: 'Official ATO myDeductions format for tax returns',
          fileExtension: 'csv',
          features: ['Business/Employee classification', 'GST calculation', 'Tax deductible filtering']
        },
        {
          id: 'csv-standard',
          name: 'Standard CSV',
          description: 'Generic CSV format for general use',
          fileExtension: 'csv',
          features: ['All transaction data', 'Customizable columns', 'Universal compatibility']
        },
        {
          id: 'json',
          name: 'JSON Export',
          description: 'Structured data format for API integration',
          fileExtension: 'json',
          features: ['Complete transaction objects', 'Metadata included', 'API friendly']
        }
      ]
    },
    timestamp: new Date().toISOString()
  });
});

// Get export statistics
router.get('/api/analytics/export/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      totalExports: 1250,
      thisMonth: 45,
      popularFormats: [
        { format: 'ato-mydeductions', count: 890, percentage: 71.2 },
        { format: 'csv-standard', count: 280, percentage: 22.4 },
        { format: 'json', count: 80, percentage: 6.4 }
      ],
      averageFileSize: '2.3MB',
      successRate: 98.5
    },
    timestamp: new Date().toISOString()
  });
});

export default router; 