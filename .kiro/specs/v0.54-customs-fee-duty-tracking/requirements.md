# Requirements Document

## Introduction

This document defines the requirements for the Customs Fee & Duty Tracking module in Gama ERP. The system will track all customs-related fees and duties including government duties (Bea Masuk, PPN, PPh), service provider fees (PPJK, handling, storage), and penalties (demurrage, customs penalties). The module integrates with PIB/PEB documents and job orders to provide comprehensive cost tracking and allocation for customs operations.

## Glossary

- **Fee_Tracking_System**: The customs fee and duty tracking management system
- **Customs_Fee**: Any fee or duty related to customs operations (government or service provider)
- **Fee_Type**: A category of customs fee (duty, tax, service, storage, penalty)
- **Government_Fee**: Fees paid to government agencies (Bea Masuk, PPN, PPh, Bea Keluar)
- **Service_Fee**: Fees paid to service providers (PPJK, handling, trucking, surveyor)
- **NTPN**: Nomor Transaksi Penerimaan Negara - Government Receipt Transaction Number
- **NTB**: Nomor Transaksi Bank - Bank Transaction Number
- **Billing_Code**: Government billing code for duty payments
- **Demurrage**: Penalty charges for container detention beyond free time
- **Free_Time**: Number of days a container can stay at port without storage charges
- **Container_Tracking**: System for tracking container status and calculating storage fees
- **BKK**: Bukti Kas Keluar - Cash Disbursement Voucher (for payment linkage)
- **PIB**: Pemberitahuan Impor Barang - Import Declaration document
- **PEB**: Pemberitahuan Ekspor Barang - Export Declaration document

## Requirements

### Requirement 1: Fee Type Management

**User Story:** As an admin, I want to manage customs fee types with their categories, so that fees can be properly classified and tracked.

#### Acceptance Criteria

1. THE Fee_Tracking_System SHALL store fee types with fee_code, fee_name, description, fee_category, and is_government_fee flag
2. THE Fee_Tracking_System SHALL support fee categories: 'duty', 'tax', 'service', 'storage', 'penalty', 'other'
3. THE Fee_Tracking_System SHALL distinguish between government fees and service provider fees
4. WHEN the system initializes, THE Fee_Tracking_System SHALL provide default fee types including BM (Bea Masuk), PPN, PPH, PPNBM, BK (Bea Keluar), STORAGE, HANDLING, TRUCKING, FUMIGATION, SURVEYOR, PPJK, PENALTY, and DEMURRAGE
5. THE Fee_Tracking_System SHALL allow filtering fee types by category and active status
6. THE Fee_Tracking_System SHALL support display ordering for fee types

### Requirement 2: Customs Fee Recording

**User Story:** As a customs officer, I want to record customs fees against PIB/PEB documents, so that all costs are tracked and allocated properly.

#### Acceptance Criteria

1. WHEN a user creates a customs fee, THE Fee_Tracking_System SHALL require document type ('pib' or 'peb') and link to the corresponding document
2. THE Fee_Tracking_System SHALL allow linking fees to job orders for cost allocation
3. THE Fee_Tracking_System SHALL require fee type selection from the fee types master
4. THE Fee_Tracking_System SHALL capture fee amount and currency (default IDR)
5. THE Fee_Tracking_System SHALL capture optional description and notes for each fee
6. THE Fee_Tracking_System SHALL track the user who created each fee record

### Requirement 3: Government Duty Payment Tracking

**User Story:** As a customs officer, I want to record government duty payments with official receipt numbers, so that payment compliance can be verified.

#### Acceptance Criteria

1. WHEN recording a government fee payment, THE Fee_Tracking_System SHALL capture NTPN (Nomor Transaksi Penerimaan Negara)
2. THE Fee_Tracking_System SHALL capture NTB (Nomor Transaksi Bank) for bank-processed payments
3. THE Fee_Tracking_System SHALL capture billing code used for the payment
4. THE Fee_Tracking_System SHALL capture payment date and payment method
5. THE Fee_Tracking_System SHALL allow uploading payment receipt documents
6. THE Fee_Tracking_System SHALL support payment statuses: 'pending', 'paid', 'waived', 'cancelled'

### Requirement 4: Service Provider Fee Tracking

**User Story:** As a customs officer, I want to record service provider fees with vendor information, so that vendor costs are properly tracked.

#### Acceptance Criteria

1. WHEN recording a service fee, THE Fee_Tracking_System SHALL allow linking to a vendor from the vendor master
2. THE Fee_Tracking_System SHALL capture vendor invoice number for reconciliation
3. THE Fee_Tracking_System SHALL capture payment reference when paid
4. THE Fee_Tracking_System SHALL allow uploading vendor invoice documents
5. THE Fee_Tracking_System SHALL track payment status for service fees

### Requirement 5: Container Tracking

**User Story:** As a customs officer, I want to track container status and calculate storage fees, so that demurrage costs are monitored and minimized.

#### Acceptance Criteria

1. THE Fee_Tracking_System SHALL track containers with container number, size, and type
2. THE Fee_Tracking_System SHALL link containers to PIB/PEB documents and job orders
3. THE Fee_Tracking_System SHALL capture terminal location for each container
4. THE Fee_Tracking_System SHALL capture arrival date and free time days (default 7 days)
5. WHEN arrival date and free time are set, THE Fee_Tracking_System SHALL calculate free time end date
6. THE Fee_Tracking_System SHALL capture gate out date when container leaves port
7. WHEN gate out date exceeds free time end, THE Fee_Tracking_System SHALL calculate storage days as gate_out_date minus free_time_end
8. THE Fee_Tracking_System SHALL capture daily storage rate and calculate total storage fee
9. THE Fee_Tracking_System SHALL support container statuses: 'at_port', 'gate_out', 'delivered', 'returned_empty'

### Requirement 6: Fee Payment Management

**User Story:** As a finance officer, I want to manage fee payments and mark fees as paid, so that payment status is accurately tracked.

#### Acceptance Criteria

1. WHEN marking a fee as paid, THE Fee_Tracking_System SHALL require payment date
2. THE Fee_Tracking_System SHALL capture payment reference number
3. THE Fee_Tracking_System SHALL capture payment method (bank transfer, cash, etc.)
4. THE Fee_Tracking_System SHALL allow uploading payment receipt
5. THE Fee_Tracking_System SHALL update payment status to 'paid'
6. THE Fee_Tracking_System SHALL allow linking payment to BKK (Bukti Kas Keluar) records

### Requirement 7: Job Customs Cost Summary

**User Story:** As a manager, I want to view total customs costs by job order, so that I can monitor job profitability.

#### Acceptance Criteria

1. THE Fee_Tracking_System SHALL aggregate customs costs by job order
2. THE Fee_Tracking_System SHALL break down costs by category: duties, taxes, services, storage, penalties
3. THE Fee_Tracking_System SHALL show total customs cost per job
4. THE Fee_Tracking_System SHALL show paid vs pending amounts per job
5. THE Fee_Tracking_System SHALL display customer name and job order number in the summary

### Requirement 8: Pending Payments View

**User Story:** As a finance officer, I want to view all pending customs payments, so that I can prioritize and process payments.

#### Acceptance Criteria

1. THE Fee_Tracking_System SHALL display all fees with payment status 'pending'
2. THE Fee_Tracking_System SHALL show fee type, category, and amount for each pending payment
3. THE Fee_Tracking_System SHALL show linked PIB/PEB reference and job order number
4. THE Fee_Tracking_System SHALL order pending payments by creation date
5. THE Fee_Tracking_System SHALL allow filtering pending payments by fee category

### Requirement 9: Fee List and Filtering

**User Story:** As a user, I want to view and filter customs fees, so that I can find and manage fee records efficiently.

#### Acceptance Criteria

1. THE Fee_Tracking_System SHALL display fees with fee type, amount, payment status, and linked document
2. THE Fee_Tracking_System SHALL allow filtering by document type (PIB/PEB)
3. THE Fee_Tracking_System SHALL allow filtering by fee category
4. THE Fee_Tracking_System SHALL allow filtering by payment status
5. THE Fee_Tracking_System SHALL allow filtering by date range
6. THE Fee_Tracking_System SHALL allow searching by reference number or description

### Requirement 10: Container List and Alerts

**User Story:** As a customs officer, I want to view container status and receive alerts for approaching demurrage, so that I can take action to minimize costs.

#### Acceptance Criteria

1. THE Fee_Tracking_System SHALL display container list with status, location, and dates
2. THE Fee_Tracking_System SHALL show free time remaining for containers at port
3. WHEN a container's free time is within 2 days of expiring, THE Fee_Tracking_System SHALL highlight it as a warning
4. WHEN a container's free time has expired, THE Fee_Tracking_System SHALL highlight it as critical and show storage days
5. THE Fee_Tracking_System SHALL allow filtering containers by status
6. THE Fee_Tracking_System SHALL show calculated storage fees for containers past free time

### Requirement 11: Role-Based Access Control

**User Story:** As a system administrator, I want to control access to fee tracking functions by role, so that users can only perform authorized actions.

#### Acceptance Criteria

1. THE Fee_Tracking_System SHALL allow Owner, Admin, Manager, Customs, and Finance roles to view fees
2. THE Fee_Tracking_System SHALL allow Owner, Admin, Manager, and Customs roles to create and edit fees
3. THE Fee_Tracking_System SHALL allow Owner, Admin, Manager, and Finance roles to update payment status
4. THE Fee_Tracking_System SHALL restrict fee deletion to Owner and Admin roles only
5. THE Fee_Tracking_System SHALL allow Finance role to view all payment-related information
6. THE Fee_Tracking_System SHALL restrict Ops and Sales roles from creating or editing fees

### Requirement 12: Reporting and Analytics

**User Story:** As a manager, I want to view customs cost reports, so that I can analyze spending patterns and optimize costs.

#### Acceptance Criteria

1. THE Fee_Tracking_System SHALL provide duty vs service fee breakdown report
2. THE Fee_Tracking_System SHALL provide customs cost by customer report
3. THE Fee_Tracking_System SHALL provide pending payments aging report
4. THE Fee_Tracking_System SHALL provide demurrage cost analysis report
5. THE Fee_Tracking_System SHALL allow exporting reports to CSV format
