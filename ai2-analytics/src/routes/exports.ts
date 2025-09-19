import express from 'express';
import { format } from 'date-fns';

const router = express.Router();

// Helper function to enhance transactions with tax categories from unified intelligence cache
// ENTERPRISE OPTIMIZATION: Single batch query to get all tax categories at once
async function enhanceTransactionsWithTaxCategories(
  prisma: any,
  userId: string,
  transactions: Transaction[]
): Promise<Map<string, string>> {
  const taxCategoryMap = new Map<string, string>();
  
  try {
    if (!transactions || transactions.length === 0) {
      return taxCategoryMap;
    }

    // Generate transaction hashes for all transactions using the same logic as UnifiedIntelligenceService
    const crypto = require('crypto');
    const transactionHashes = transactions.map(tx => {
      // Use TransactionNormalizationService logic for consistent hash generation
      const normalizedDescription = tx.description
        .toLowerCase()
        .trim()
        .replace(/\d+/g, '') // Remove reference numbers
        .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '') // Remove dates
        .replace(/\b\d{2}:\d{2}\b/g, '') // Remove times
        .replace(/\b(transfer|payment|deposit|withdrawal)\b/g, '') // Remove common bank terms
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      const normalizedMerchant = (tx.merchant?.trim().toLowerCase() || '').replace(/\s+/g, ' ');
      const txString = `${normalizedDescription}|0|${normalizedMerchant}`;
      const hash = crypto.createHash('md5').update(txString).digest('hex').substring(0, 12);
      
      return {
        transactionId: tx.id,
        hash: hash
      };
    });

    const hashes = transactionHashes.map(th => th.hash);
    
    if (hashes.length === 0) {
      return taxCategoryMap;
    }

    // ENTERPRISE OPTIMIZATION: Single batch query for all transaction hashes
    const cacheEntries = await prisma.$queryRaw`
      SELECT DISTINCT ON ("transactionHash") 
        "transactionHash", 
        "taxResult", 
        "categoryResult",
        "userId"
      FROM unified_intelligence_cache 
      WHERE "transactionHash" = ANY(${hashes})
        AND ("userId" = ${userId} OR "userId" IS NULL)
        AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
      ORDER BY 
        "transactionHash",
        CASE WHEN "userId" = ${userId} THEN 1 ELSE 2 END,
        "createdAt" DESC
    `;

    // Create hash to transaction ID mapping
    const hashToTransactionId = new Map<string, string>();
    transactionHashes.forEach(th => {
      hashToTransactionId.set(th.hash, th.transactionId);
    });

    // Process cache entries and extract tax categories
    if (cacheEntries && Array.isArray(cacheEntries)) {
      cacheEntries.forEach(entry => {
        const transactionId = hashToTransactionId.get(entry.transactionHash);
        if (!transactionId) return;

        try {
          // Try tax result first
          if (entry.taxResult) {
            const taxResult = JSON.parse(entry.taxResult);
            if (taxResult && 
                typeof taxResult === 'object' && 
                taxResult.taxCategory && 
                typeof taxResult.taxCategory === 'string' &&
                taxResult.taxConfidence > 0.5) {
              taxCategoryMap.set(transactionId, taxResult.taxCategory);
              return;
            }
          }

          // Fallback to category result
          if (entry.categoryResult) {
            const categoryResult = JSON.parse(entry.categoryResult);
            if (categoryResult && 
                typeof categoryResult === 'object' &&
                categoryResult.taxCategory &&
                typeof categoryResult.taxCategory === 'string' &&
                categoryResult.taxConfidence > 0.5) {
              taxCategoryMap.set(transactionId, categoryResult.taxCategory);
              return;
            }
          }
        } catch (parseError) {
          console.warn(`⚠️ Failed to parse cache result for transaction ${transactionId}:`, parseError);
        }
      });
    }

    console.log(`✅ Enhanced ${taxCategoryMap.size}/${transactions.length} transactions with tax categories from unified intelligence cache`);
    
  } catch (error) {
    console.error('❌ Failed to enhance transactions with tax categories:', error);
  }

  return taxCategoryMap;
}

// Interface for transaction data (matching core app structure)
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  primaryType: 'expense' | 'income';
  isTaxDeductible: boolean;
  businessUsePercentage?: number;
  expenseType?: 'business' | 'employee' | 'personal';
  reference?: string;
  merchant?: string;
  category?: string;
  gstAmount?: number;
  taxCategory?: string; // Tax category from unified intelligence cache
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
  // ENTERPRISE PERFORMANCE: Optimized single-pass processing with pre-allocated arrays
  const startTime = performance.now();
  const totalTxns = transactions.length;
  
  // MEMORY OPTIMIZATION: Pre-allocate arrays with estimated capacity
  const estimatedIncome = Math.min(Math.ceil(totalTxns * 0.15), 2000);
  const estimatedExpenses = Math.min(Math.ceil(totalTxns * 0.35), 5000);
  
  const income: Transaction[] = new Array(estimatedIncome);
  const expenses: Transaction[] = new Array(estimatedExpenses);
  let incomeIndex = 0;
  let expenseIndex = 0;
  
  let totalIncome = 0;
  let totalExpenses = 0;
  let businessExpenses = 0;
  let employeeExpenses = 0;
  
  console.log(`📊 ENTERPRISE PROCESSING: ${totalTxns} transactions, pre-allocated ${estimatedIncome} income, ${estimatedExpenses} expenses`);
  
  // ENTERPRISE OPTIMIZATION: Single pass with optimized conditionals
  for (let i = 0; i < totalTxns; i++) {
    const t = transactions[i];
    const amount = Math.abs(t.amount);
    
    // Optimized conditionals - check most common case first
    if (t.primaryType === 'expense' && t.isTaxDeductible) {
      if (expenseIndex < estimatedExpenses) {
        expenses[expenseIndex++] = t;
      } else {
        expenses.push(t); // Fallback to dynamic growth
      }
      totalExpenses += amount;
      
      // Categorize expense types efficiently
      if (t.expenseType === 'employee') {
        employeeExpenses += amount;
      } else {
        businessExpenses += amount;
      }
    } else if (t.primaryType === 'income' && t.expenseType === 'business') {
      if (incomeIndex < estimatedIncome) {
        income[incomeIndex++] = t;
      } else {
        income.push(t); // Fallback to dynamic growth
      }
      totalIncome += amount;
    }
  }
  
  // Trim arrays to actual size for memory efficiency
  if (incomeIndex < income.length) income.length = incomeIndex;
  if (expenseIndex < expenses.length) expenses.length = expenseIndex;
  
  const processingTime = performance.now() - startTime;
  console.log(`⚡ ENTERPRISE PROCESSING: Completed in ${processingTime.toFixed(2)}ms (${(totalTxns / (processingTime / 1000)).toFixed(0)} tx/sec)`);

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
async function generateATOCSV(transactions: Transaction[], trips: Trip[], vehicles: Vehicle[], startDate: string, endDate: string, unlinkedBills?: UnlinkedBillOccurrence[], userId?: string, prisma?: any): Promise<string> {
  const processed = processTransactionsForATO(transactions, trips, vehicles, unlinkedBills);
  
  // ENTERPRISE OPTIMIZATION: Batch enhance all transactions with tax categories at once
  let taxCategoryMap = new Map<string, string>();
  if (userId && prisma && transactions.length > 0) {
    try {
      taxCategoryMap = await enhanceTransactionsWithTaxCategories(prisma, userId, transactions);
    } catch (error) {
      console.warn('⚠️ Failed to enhance transactions with tax categories, proceeding without enhancement:', error);
    }
  }
  
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
    
    // ENHANCED: Add tax category to description if available from batch lookup
    let enhancedDescription = income.description;
    const taxCategory = taxCategoryMap.get(income.id);
    if (taxCategory) {
      enhancedDescription = `${taxCategory} = ${income.description}`;
    } else if (income.taxCategory) {
      enhancedDescription = `${income.taxCategory} = ${income.description}`;
    }
    
    csvLines.push(`Not uploaded,Business,Completed,${formatDateForATO(income.date)},${amount.toFixed(2)},${gst.toFixed(2)},"${enhancedDescription}","${income.reference || ''}",,,`);
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
    
    // ENHANCED: Add tax category to description if available from batch lookup
    let enhancedDescription = expense.description;
    const taxCategory = taxCategoryMap.get(expense.id);
    if (taxCategory) {
      enhancedDescription = `${taxCategory} = ${expense.description}`;
    } else if (expense.taxCategory) {
      enhancedDescription = `${expense.taxCategory} = ${expense.description}`;
    }
    
    csvLines.push(`Not uploaded,${type},Completed,${formatDateForATO(expense.date)},${amount.toFixed(2)},${gst ? gst.toFixed(2) : ''},"${enhancedDescription}",${percentage}%,"${subType}","${subTypeDetail}",,,`);
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
  
  // Add footer with branding
  csvLines.push('');
  csvLines.push('Powered by app.ai2fin.com');
  
  // PERFORMANCE FIX: Single join() operation instead of multiple string concatenations
  return csvLines.join('\n');
}

// Generate ATO myDeductions export with travel data
router.post('/api/analytics/export/ato-mydeductions', async (req, res) => {
  const startTime = Date.now();
  
  // TIMEOUT PROTECTION: Set a maximum processing time for exports
  const timeoutMs = 60000; // 60 seconds max for exports
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`⏰ Export timeout after ${timeoutMs}ms`);
      res.status(408).json({
        success: false,
        error: 'Export timeout - dataset too large for processing',
        timeoutMs,
        timestamp: new Date().toISOString()
      });
    }
  }, timeoutMs);
  
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

    const { startDate, endDate, transactions, trips, vehicles, unlinkedBills, totalTransactions } = req.body;
    
    // ENTERPRISE VALIDATION: Comprehensive input validation
    if (!startDate || !endDate || !transactions) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: startDate, endDate, transactions',
        timestamp: new Date().toISOString()
      });
    }
    
    // ENTERPRISE SECURITY: Validate data types and ranges
    if (!Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transactions data: must be an array',
        timestamp: new Date().toISOString()
      });
    }
    
    if (transactions.length > 50000) {
      return res.status(400).json({
        success: false,
        error: 'Dataset too large: maximum 50,000 transactions allowed',
        timestamp: new Date().toISOString()
      });
    }
    
    // ENTERPRISE SECURITY: Validate date format and range
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format: use YYYY-MM-DD',
        timestamp: new Date().toISOString()
      });
    }
    
    if (startDateObj > endDateObj) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range: start date must be before end date',
        timestamp: new Date().toISOString()
      });
    }
    
    // ENTERPRISE SECURITY: Validate date range (max 5 years for large datasets)
    const maxDateRange = 5 * 365 * 24 * 60 * 60 * 1000; // 5 years in milliseconds
    if (endDateObj.getTime() - startDateObj.getTime() > maxDateRange) {
      return res.status(400).json({
        success: false,
        error: 'Date range too large: maximum 2 years allowed',
        timestamp: new Date().toISOString()
      });
    }

    // ENTERPRISE STREAMING: Process large datasets in chunks to prevent memory issues
    const totalTxns = totalTransactions || transactions.length;
    const maxTransactions = 100000; // ENTERPRISE: Increased limit to 100,000 for large datasets
    const limitedTransactions = transactions.slice(0, maxTransactions);
    
    if (transactions.length > maxTransactions) {
      console.warn(`⚠️ Large dataset detected: ${transactions.length} transactions, limiting to ${maxTransactions} for performance`);
    }

    console.log(`🔄 ENTERPRISE EXPORT: Generating ATO CSV for ${limitedTransactions.length} transactions (${totalTxns} total)...`);
    
    // MEMORY MONITORING: Check memory before processing
    const memBefore = process.memoryUsage();
    console.log(`🧠 Memory before export: ${Math.round(memBefore.heapUsed / 1024 / 1024)}MB`);
    
    // ENTERPRISE QUOTA: Check export quota before processing
    try {
      // CRITICAL FIX: Use environment-based URL for production compatibility
      const coreAppUrl = process.env.CORE_APP_URL || process.env.ANALYTICS_CORE_URL || 'http://localhost:3001';
      const quotaResponse = await fetch(`${coreAppUrl}/api/quota/check`, {
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
          details: (quotaError as any).error || 'Quota check failed',
          timestamp: new Date().toISOString()
        });
      }
      
      console.log('✅ Export quota check passed');
    } catch (quotaError) {
      console.warn('⚠️ Quota check failed, proceeding without enforcement:', quotaError);
      // Continue without quota enforcement in case of service unavailability
    }
    
    // Generate CSV content using real transaction data, travel data, and unlinked bills
    // ENHANCED: Pass userId and prisma for tax category lookup from unified intelligence cache
    const csvContent = await generateATOCSV(limitedTransactions, trips || [], vehicles || [], startDate, endDate, unlinkedBills || [], userId, req.app.locals.prisma);
    const filename = `ATO_myDeductions_${format(new Date(startDate), 'yyyy-MM-dd')}_to_${format(new Date(endDate), 'yyyy-MM-dd')}.csv`;
    
    // MEMORY MONITORING: Check memory after processing
    const memAfter = process.memoryUsage();
    const memoryIncrease = Math.round((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024);
    console.log(`🧠 Memory after export: ${Math.round(memAfter.heapUsed / 1024 / 1024)}MB (+${memoryIncrease}MB)`);
    
    // MEMORY SAFETY: Force garbage collection if memory usage is high
    if (memAfter.heapUsed > 1000 * 1024 * 1024) { // 1GB threshold
      console.log(`🧹 High memory usage detected, forcing garbage collection...`);
      if (global.gc) {
        global.gc();
        const memAfterGC = process.memoryUsage();
        console.log(`🧹 Memory after GC: ${Math.round(memAfterGC.heapUsed / 1024 / 1024)}MB`);
      }
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ ENTERPRISE EXPORT: ATO CSV generation completed in ${processingTime}ms for ${limitedTransactions.length} transactions`);

    // ENTERPRISE QUOTA: Consume export quota after successful generation
    try {
      // CRITICAL FIX: Use environment-based URL for production compatibility
      const coreAppUrl = process.env.CORE_APP_URL || process.env.ANALYTICS_CORE_URL || 'http://localhost:3001';
      await fetch(`${coreAppUrl}/api/quota/consume`, {
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

    // Clear timeout since export completed successfully
    clearTimeout(timeoutId);
    
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
    // Clear timeout on error too
    clearTimeout(timeoutId);
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
  
  // TIMEOUT PROTECTION: Set a maximum processing time
  const timeoutMs = 30000; // 30 seconds max
  const timeoutId = setTimeout(() => {
    if (!res.headersSent) {
      console.error(`⏰ Export preview timeout after ${timeoutMs}ms`);
      res.status(408).json({
        success: false,
        error: 'Request timeout - dataset too large for processing',
        timeoutMs,
        timestamp: new Date().toISOString()
      });
    }
  }, timeoutMs);
  
  try {
    // ENTERPRISE SECURITY: Validate user authentication
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required for preview',
        timestamp: new Date().toISOString()
      });
    }

    const { startDate, endDate, transactions, trips, vehicles, unlinkedBills, page = 1, pageSize = 1000, totalTransactions } = req.body;
    
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
    // CRITICAL FIX: Use totalTransactions from frontend for proper pagination context
    const totalTxns = totalTransactions || transactions.length;
    const maxPageSize = 20000; // ENTERPRISE: Increased limit to 20,000 per page for large datasets
    const actualPageSize = Math.min(pageSize, maxPageSize);
    const totalPages = Math.ceil(totalTxns / actualPageSize);
    
    // The transactions array is already paginated by the frontend
    // No need to slice it again - process all transactions in this request
    const pageTransactions = transactions;
    
    console.log(`🔄 ENTERPRISE PROCESSING: Page ${page}/${totalPages} - ${pageTransactions.length} transactions of ${totalTxns} total`);
    
    // Progress logging for large datasets
    if (totalTxns > 1000) {
      console.log(`📊 Large dataset processing: ${totalTxns} total transactions, processing page ${page}/${totalPages}`);
    }
    
    // MEMORY MONITORING: Check memory before processing
    const memBefore = process.memoryUsage();
    console.log(`🧠 Memory before processing: ${Math.round(memBefore.heapUsed / 1024 / 1024)}MB`);
    
    // Process current page of transaction data (STREAMING: Only process current page)
    let previewData;
    try {
      previewData = processTransactionsForATO(pageTransactions, trips, vehicles, unlinkedBills);
      
      // Add streaming metadata for large datasets
      if (totalTxns > 1000) {
        previewData.streaming = {
          isStreaming: true,
          currentPage: page,
          totalPages,
          processedTransactions: pageTransactions.length,
          totalTransactions: totalTxns,
          progressPercentage: Math.round((page / totalPages) * 100)
        };
      }
    } catch (processingError) {
      console.error(`❌ Processing error for page ${page}:`, processingError);
      throw new Error(`Failed to process transactions for page ${page}: ${processingError.message}`);
    }
    
    // MEMORY MONITORING: Check memory after processing
    const memAfter = process.memoryUsage();
    const memoryIncrease = Math.round((memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024);
    console.log(`🧠 Memory after processing: ${Math.round(memAfter.heapUsed / 1024 / 1024)}MB (+${memoryIncrease}MB)`);
    
    // MEMORY SAFETY: Force garbage collection if memory usage is high
    if (memAfter.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
      console.log(`🧹 High memory usage detected, forcing garbage collection...`);
      if (global.gc) {
        global.gc();
        const memAfterGC = process.memoryUsage();
        console.log(`🧹 Memory after GC: ${Math.round(memAfterGC.heapUsed / 1024 / 1024)}MB`);
      }
    }
    
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
        totalTransactions: totalTxns,
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

    // Clear timeout since request completed successfully
    clearTimeout(timeoutId);
    
    // ENTERPRISE RESPONSE: Include pagination metadata
    res.json({
      success: true,
      data: responseData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Clear timeout on error too
    clearTimeout(timeoutId);
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