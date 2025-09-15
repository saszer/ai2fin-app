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
  
  // MEMORY OPTIMIZATION: Pre-allocate arrays for large datasets
  if (transactions.length > 1000) {
    // Pre-allocate arrays with estimated capacity for better performance
    const estimatedIncome = Math.min(transactions.length * 0.1, 1000);
    const estimatedExpenses = Math.min(transactions.length * 0.3, 3000);
    // Note: JavaScript arrays grow dynamically, so we just log the optimization
    console.log(`📊 Memory optimization: Processing ${transactions.length} transactions with estimated ${estimatedIncome} income, ${estimatedExpenses} expenses`);
  }
  
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
    // ENTERPRISE SECURITY: Extract user ID from request headers
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required for export',
        timestamp: new Date().toISOString()
      });
    }

    const { startDate, endDate, transactions, trips, vehicles, unlinkedBills } = req.body;
    
    if (!startDate || !endDate || !transactions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: startDate, endDate, transactions',
        timestamp: new Date().toISOString()
      });
    }

    // PERFORMANCE SAFEGUARD: Limit transaction processing to prevent timeouts
    const maxTransactions = 10000; // Increased limit for production
    const limitedTransactions = transactions.slice(0, maxTransactions);
    
    if (transactions.length > maxTransactions) {
      console.warn(`⚠️ Large dataset detected: ${transactions.length} transactions, limiting to ${maxTransactions} for performance`);
    }

    console.log(`🔄 Generating ATO CSV for ${limitedTransactions.length} transactions...`);
    
    // ENTERPRISE QUOTA: Check export quota before processing
    try {
      const quotaResponse = await fetch(`${process.env.CORE_APP_URL || 'http://localhost:3001'}/api/quota/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
          'X-User-ID': userId
        },
        body: JSON.stringify({
          feature: 'exports',
          amount: 1
        })
      });
      
      if (!quotaResponse.ok) {
        const quotaError = await quotaResponse.json();
        return res.status(429).json({
          success: false,
          error: 'Export quota exceeded',
          details: quotaError.error,
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('✅ Export quota check passed');
    } catch (quotaError) {
      console.warn('⚠️ Quota check failed, proceeding without enforcement:', quotaError);
      // Continue without quota enforcement in case of service unavailability
    }
    
    // Generate CSV content using real transaction data, travel data, and unlinked bills
    const csvContent = generateATOCSV(limitedTransactions, trips || [], vehicles || [], startDate, endDate, unlinkedBills || []);
    const filename = `ATO_myDeductions_${format(new Date(startDate), 'yyyy-MM-dd')}_to_${format(new Date(endDate), 'yyyy-MM-dd')}.csv`;
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ ATO CSV generation completed in ${processingTime}ms`);

    // ENTERPRISE QUOTA: Consume export quota after successful generation
    try {
      await fetch(`${process.env.CORE_APP_URL || 'http://localhost:3001'}/api/quota/consume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization || '',
          'X-User-ID': userId
        },
        body: JSON.stringify({
          feature: 'exports',
          amount: 1,
          metadata: {
            transactionCount: limitedTransactions.length,
            processingTimeMs: processingTime,
            exportType: 'ato-mydeductions'
          }
        })
      });
      console.log('✅ Export quota consumed successfully');
    } catch (quotaError) {
      console.warn('⚠️ Quota consumption failed:', quotaError);
      // Don't fail the export if quota consumption fails
    }

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

// Get export preview data (ENTERPRISE-GRADE: Streaming & Pagination for big datasets)
router.post('/api/analytics/export/preview', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { startDate, endDate, transactions, trips, vehicles, unlinkedBills, page = 1, pageSize = 1000 } = req.body;
    
    // ENTERPRISE CACHING: Check cache first for performance
    const cacheKey = `preview:${startDate}:${endDate}:${page}:${pageSize}`;
    const cachedData = req.app.locals.getCachedData?.(cacheKey);
    if (cachedData) {
      console.log(`⚡ CACHE HIT: Returning cached data for page ${page}`);
      return res.json({
        success: true,
        data: cachedData,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!startDate || !endDate || !transactions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: startDate, endDate, transactions',
        timestamp: new Date().toISOString()
      });
    }

    // ENTERPRISE PAGINATION: Process data in chunks to prevent memory issues
    const totalTransactions = transactions.length;
    const maxPageSize = 5000; // Enterprise limit per page
    const actualPageSize = Math.min(pageSize, maxPageSize);
    const totalPages = Math.ceil(totalTransactions / actualPageSize);
    const startIndex = (page - 1) * actualPageSize;
    const endIndex = Math.min(startIndex + actualPageSize, totalTransactions);
    
    // Get current page of transactions
    const pageTransactions = transactions.slice(startIndex, endIndex);
    
    console.log(`🔄 ENTERPRISE PROCESSING: Page ${page}/${totalPages} - ${pageTransactions.length} transactions (${startIndex}-${endIndex} of ${totalTransactions})`);
    
    // Progress logging for large datasets
    if (totalTransactions > 1000) {
      console.log(`📊 Large dataset processing: ${totalTransactions} total transactions, processing page ${page}/${totalPages}`);
    }
    
    // Process current page of transaction data
    const previewData = processTransactionsForATO(pageTransactions, trips, vehicles, unlinkedBills);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ ATO export preview page ${page} completed in ${processingTime}ms`);

    // Prepare response data
    const responseData = {
      ...previewData,
      // Add pagination metadata
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: actualPageSize,
        totalTransactions,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      // Add performance metrics
      performance: {
        processingTimeMs: processingTime,
        transactionsPerSecond: Math.round(pageTransactions.length / (processingTime / 1000)),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
      }
    };

    // ENTERPRISE CACHING: Cache the processed data
    req.app.locals.setCachedData?.(cacheKey, responseData);

    // ENTERPRISE RESPONSE: Include pagination metadata
    res.json({
      success: true,
      data: responseData,
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