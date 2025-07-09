Logic document: 


Bills are made of number of occurences, these can be linked to transactions. 
Each bill also has options to mark it as Tax deductable and assign category(there is a glabal categories section). 
When transactions are linked to the occurences of the bill, transaction amount will override just that particular occurence of the bill. While category of the bill will override all linked transactions categories and assign it.


While bills have an amount, each occurence can have its own amount too. 

Totals from bills should be logical, and amount of changed occurence should be reflected , calculated and recognised properly amongst whole logic - tax calculations, totals etc.

If a transaction is linked to a bill,  status of occurence is set to paid automatically

-- the bills connector ai: system which tries to autolink transactions to occurence of bill, it checks for name, date etc and other similar patterns and gives recommendations on which transactions might link to which bill. It also checks for reocurring patterns and similar transactions in intervals and gives recommendation on converting a batch of transaction to bill. or what transaction might link to what bill and what occurence considering, name , date, pattern etc.
