# GAMA ERP RBAC Diagrams

Copy and paste these into [mermaid.live](https://mermaid.live) to view.

---

## 1. Organization Hierarchy

```mermaid
flowchart TB
    subgraph EXECUTIVE["👑 EXECUTIVE LEVEL"]
        OWNER["<b>owner</b><br/>Dio Atmando<br/>Final Approver"]
        DIR["<b>director</b><br/>Managing Director<br/>Can Approve PJO/JO/BKK"]
    end
    
    subgraph MANAGEMENT["📊 MANAGEMENT LEVEL (Can Check, Cannot Approve)"]
        MGR1["<b>manager</b><br/>Hutami<br/>Scope: Marketing + Engineering"]
        MGR2["<b>manager</b><br/>Feri<br/>Scope: Administration + Finance"]
        MGR3["<b>manager</b><br/>Reza<br/>Scope: Operations + Assets"]
    end
    
    subgraph STAFF["👥 STAFF LEVEL"]
        MKT["<b>marketing</b><br/>Quotations, Customers<br/>Cost Estimation"]
        ADM["<b>administration</b><br/>PJO, Invoices<br/>Document Prep"]
        FIN["<b>finance</b><br/>Payments, AR/AP<br/>BKK Prep"]
        OPS["<b>ops</b><br/>Job Execution<br/>NO Revenue View"]
        ENG["<b>engineer</b><br/>Surveys, JMP<br/>Drawings"]
        HR["<b>hr</b><br/>Employees<br/>Payroll"]
        HSE["<b>hse</b><br/>Safety<br/>Incidents"]
        SYS["<b>sysadmin</b><br/>IT Admin<br/>Users"]
    end
    
    OWNER --> DIR
    DIR --> MGR1
    DIR --> MGR2
    DIR --> MGR3
    
    MGR1 -.-> MKT
    MGR1 -.-> ENG
    MGR2 -.-> ADM
    MGR2 -.-> FIN
    MGR3 -.-> OPS
    MGR3 -.-> HSE
    
    OWNER -.-> SYS
    DIR -.-> HR
```

---

## 2. Business Workflow (Quotation to Invoice)

```mermaid
flowchart LR
    subgraph MARKETING["🎯 MARKETING"]
        Q1[Create Quotation]
        Q2[Structure Cost Estimates]
        Q3[Set Pricing]
    end
    
    subgraph ENGINEERING["⚙️ ENGINEERING"]
        E1{Complex?}
        E2[Technical Review]
        E3[Route Survey]
        E4[JMP Creation]
    end
    
    subgraph ADMIN["📋 ADMINISTRATION"]
        A1["Prepare PJO<br/>(Maker)"]
        A2[Set Budget]
    end
    
    subgraph MANAGER["👔 MANAGER (Feri)"]
        M1["Check PJO<br/>(Checker)"]
    end
    
    subgraph DIRECTOR["👑 DIRECTOR/OWNER"]
        D1["Approve PJO<br/>(Approver)"]
    end
    
    subgraph OPS["🚛 OPERATIONS"]
        O1[Execute Job]
        O2[Track Expenses]
        O3[Delivery Docs]
    end
    
    subgraph FINAL["📄 FINALIZATION"]
        F1["Compile Costs<br/>(Admin)"]
        F2["Check JO<br/>(Feri)"]
        F3["Approve JO<br/>(Director)"]
        F4[Create Invoice]
    end
    
    Q1 --> Q2 --> Q3 --> E1
    E1 -->|Yes| E2 --> E3 --> E4 --> A1
    E1 -->|No| A1
    A1 --> A2 --> M1 --> D1
    D1 -->|Approved| O1
    O1 --> O2 --> O3 --> F1
    F1 --> F2 --> F3 --> F4
```

---

## 3. Maker-Checker-Approver Workflow

```mermaid
flowchart TB
    subgraph PJO["📋 PJO WORKFLOW"]
        P1["DRAFT<br/>Created by Administration"]
        P2["CHECKED<br/>Reviewed by Manager (Feri)"]
        P3["APPROVED<br/>Approved by Director/Owner"]
        P4["REJECTED"]
        
        P1 -->|"Manager checks"| P2
        P2 -->|"Director/Owner approves"| P3
        P2 -->|"Director/Owner rejects"| P4
        P1 -->|"Manager rejects"| P4
    end
    
    subgraph JO["📦 JO WORKFLOW (After Costs Collected)"]
        J1["DRAFT<br/>Costs compiled by Admin"]
        J2["CHECKED<br/>Reviewed by Manager (Feri)"]
        J3["APPROVED<br/>Approved by Director/Owner"]
        J4["REJECTED"]
        
        J1 -->|"Manager checks"| J2
        J2 -->|"Director/Owner approves"| J3
        J2 -->|"Director/Owner rejects"| J4
    end
    
    subgraph BKK["💰 BKK WORKFLOW (Disbursement)"]
        B1["DRAFT<br/>Created by Admin/Finance"]
        B2["CHECKED<br/>Reviewed by Manager (Feri)"]
        B3["APPROVED<br/>Approved by Director/Owner"]
        B4["REJECTED"]
        
        B1 -->|"Manager checks"| B2
        B2 -->|"Director/Owner approves"| B3
        B2 -->|"Director/Owner rejects"| B4
    end
```

---

## 4. Data Visibility Matrix

```mermaid
flowchart TB
    subgraph DATA["📊 DATA TYPES"]
        REV["Revenue & Pricing"]
        ACTUAL["Actual Costs"]
        EST["Cost Estimates"]
        PROFIT["Profit Margins"]
    end
    
    subgraph FULL["✅ FULL ACCESS"]
        R1["owner"]
        R2["director"]
        R3["manager"]
        R4["finance"]
    end
    
    subgraph PARTIAL["⚠️ PARTIAL ACCESS"]
        R5["marketing<br/>(Revenue + Estimates ONLY)"]
        R6["administration<br/>(Revenue + Costs, NO profit)"]
    end
    
    subgraph RESTRICTED["🚫 RESTRICTED"]
        R7["ops<br/>(Costs ONLY, NO revenue)"]
    end
    
    REV --> FULL
    REV --> R5
    REV --> R6
    ACTUAL --> FULL
    ACTUAL --> R6
    EST --> FULL
    EST --> R5
    EST --> R7
    PROFIT --> R1
    PROFIT --> R2
    PROFIT --> R3
    PROFIT --> R4
```

---

## 5. Manager Department Scope

```mermaid
flowchart TB
    subgraph HUTAMI["👩 HUTAMI's DASHBOARD"]
        H1["Marketing Widgets"]
        H2["Engineering Widgets"]
        H3["Quotations Pipeline"]
        H4["Pending Assessments"]
        H5["Win/Loss Rate"]
    end
    
    subgraph FERI["👨 FERI's DASHBOARD"]
        F1["Administration Widgets"]
        F2["Finance Widgets"]
        F3["PJO Queue"]
        F4["AR Aging"]
        F5["Invoice Status"]
    end
    
    subgraph REZA["👨 REZA's DASHBOARD"]
        R1["Operations Widgets"]
        R2["Assets Widgets"]
        R3["Active Jobs"]
        R4["Equipment Status"]
        R5["Maintenance Schedule"]
    end
    
    MGR["manager role"] --> HUTAMI
    MGR --> FERI
    MGR --> REZA
    
    HUTAMI -.->|"department_scope:<br/>['marketing', 'engineering']"| H1
    FERI -.->|"department_scope:<br/>['administration', 'finance']"| F1
    REZA -.->|"department_scope:<br/>['operations', 'assets']"| R1
```

---

## 6. Complete Role Summary

```mermaid
flowchart TB
    subgraph ROLES["🎭 11 ROLES"]
        direction TB
        R1["1. owner - Full access, final approver"]
        R2["2. director - Executive, can approve"]
        R3["3. manager - Dept head, can check only"]
        R4["4. sysadmin - IT admin, users"]
        R5["5. administration - PJO, invoices, docs"]
        R6["6. finance - Payments, AR/AP, BKK"]
        R7["7. marketing - Quotations, customers"]
        R8["8. ops - Job execution, NO revenue"]
        R9["9. engineer - Surveys, JMP, drawings"]
        R10["10. hr - Employees, payroll"]
        R11["11. hse - Safety, incidents"]
    end
    
    subgraph APPROVAL["✅ CAN APPROVE"]
        A1["owner ✓"]
        A2["director ✓"]
    end
    
    subgraph CHECK["👁️ CAN CHECK ONLY"]
        C1["manager ✓"]
    end
    
    subgraph PREPARE["📝 CAN PREPARE"]
        P1["administration - PJO, Invoice"]
        P2["finance - BKK"]
    end
```



---

## 7. Manager Permission Inheritance

```mermaid
flowchart TB
    subgraph HUTAMI["👩 HUTAMI (Manager)"]
        H_SCOPE["department_scope:<br/>['marketing', 'engineering']"]
        H_INHERIT["Inherits permissions from:"]
        H_MKT["✅ marketing role"]
        H_ENG["✅ engineer role"]
        H_CAN["CAN DO:<br/>• Create quotations<br/>• Create surveys<br/>• Create JMP<br/>• Create drawings<br/>• Check documents"]
        H_CANT["CANNOT DO:<br/>• Create PJO ❌<br/>• Approve anything ❌"]
    end
    
    subgraph FERI["👨 FERI (Manager)"]
        F_SCOPE["department_scope:<br/>['administration', 'finance']"]
        F_INHERIT["Inherits permissions from:"]
        F_ADM["✅ administration role"]
        F_FIN["✅ finance role"]
        F_CAN["CAN DO:<br/>• Create PJO<br/>• Create invoices<br/>• Create BKK<br/>• Process payments<br/>• Check documents"]
        F_CANT["CANNOT DO:<br/>• Create quotations ❌<br/>• Approve anything ❌"]
    end
    
    subgraph REZA["👨 REZA (Manager)"]
        R_SCOPE["department_scope:<br/>['operations', 'assets']"]
        R_INHERIT["Inherits permissions from:"]
        R_OPS["✅ ops role"]
        R_CAN["CAN DO:<br/>• Execute jobs<br/>• Add expenses<br/>• Manage equipment<br/>• Create delivery docs<br/>• Check documents"]
        R_CANT["CANNOT DO:<br/>• Create PJO ❌<br/>• Create invoices ❌<br/>• Approve anything ❌"]
    end
    
    H_SCOPE --> H_INHERIT
    H_INHERIT --> H_MKT
    H_INHERIT --> H_ENG
    H_MKT --> H_CAN
    H_ENG --> H_CAN
    
    F_SCOPE --> F_INHERIT
    F_INHERIT --> F_ADM
    F_INHERIT --> F_FIN
    F_ADM --> F_CAN
    F_FIN --> F_CAN
    
    R_SCOPE --> R_INHERIT
    R_INHERIT --> R_OPS
    R_OPS --> R_CAN
```

---

## 8. Audit Trail Flow

```mermaid
flowchart LR
    subgraph ACTION["🎯 USER ACTION"]
        A1["User performs action<br/>(create, update, approve, etc.)"]
    end
    
    subgraph CAPTURE["📝 CAPTURE"]
        C1["User ID & Name"]
        C2["User Role"]
        C3["Action Type"]
        C4["Record Details"]
        C5["Old/New Values"]
        C6["IP & User Agent"]
        C7["Timestamp"]
    end
    
    subgraph STORE["💾 AUDIT_LOGS TABLE"]
        S1["Immutable Record<br/>(No UPDATE/DELETE allowed)"]
    end
    
    subgraph QUERY["🔍 QUERY CAPABILITIES"]
        Q1["By User"]
        Q2["By Record"]
        Q3["By Module"]
        Q4["By Date Range"]
        Q5["By Action Type"]
    end
    
    A1 --> CAPTURE
    C1 --> S1
    C2 --> S1
    C3 --> S1
    C4 --> S1
    C5 --> S1
    C6 --> S1
    C7 --> S1
    S1 --> QUERY
```

---

## 9. Complete System Flow

```mermaid
flowchart TB
    subgraph CLIENT["🖥️ CLIENT REQUEST"]
        REQ["User requests action"]
    end
    
    subgraph AUTH["🔐 AUTHENTICATION"]
        A1["Get user profile"]
        A2["Get user role"]
        A3["Get department_scope<br/>(if manager)"]
    end
    
    subgraph RBAC["🛡️ RBAC CHECK"]
        R1{"Direct role<br/>has permission?"}
        R2{"Manager with<br/>inherited permission?"}
        R3["DENIED"]
        R4["ALLOWED"]
    end
    
    subgraph EXECUTE["⚡ EXECUTE"]
        E1["Perform action"]
        E2["Log to audit_logs"]
    end
    
    subgraph RESPONSE["📤 RESPONSE"]
        RES["Return result"]
    end
    
    REQ --> AUTH
    A1 --> A2 --> A3
    A3 --> R1
    R1 -->|Yes| R4
    R1 -->|No| R2
    R2 -->|Yes| R4
    R2 -->|No| R3
    R4 --> E1 --> E2 --> RES
    R3 --> RES
```

