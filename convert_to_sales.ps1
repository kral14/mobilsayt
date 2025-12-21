$content = Get-Content "c:\Users\nesib\.gemini\antigravity\scratch\mobilsayt\web\src\pages\Qaimeler\Satis.tsx" -Raw

# API və tip dəyişiklikləri
$content = $content -replace 'purchaseInvoicesAPI','ordersAPI'
$content = $content -replace 'suppliersAPI','customersAPI'
$content = $content -replace 'PurchaseInvoice','SaleInvoice'

# Supplier -> Customer (dəqiq uyğunlaşma)
$content = $content -replace '\bSupplier\b','Customer'
$content = $content -replace '\bsuppliers\b','customers'
$content = $content -replace '\bsetSuppliers\b','setCustomers'
$content = $content -replace 'supplier_name','customer_name'
$content = $content -replace 'supplier_id','customer_id'

# Modal ID
$content = $content -replace 'purchase-invoice-modal','invoice-modal'

# Invoice type
$content = $content -replace "invoiceType: 'purchase'","invoiceType: 'sale'"

# Komponent adları
$content = $content -replace 'AlisQaimeleriContent','SatisQaimeleriContent'
$content = $content -replace 'AlisQaimeleriPage','SatisQaimeleri'

# Səhifə ID-ləri
$content = $content -replace "qaimeler-alis","qaimeler-satis"
$content = $content -replace "Alış Qaimələri","Satış Qaimələri"

# Təchizatçı -> Müştəri (UI)
$content = $content -replace 'Təchizatçı','Müştəri'

# is_active tip xətası
$content = $content -replace 'fullInvoice\.is_active','(fullInvoice as any).is_active'

# purchase_invoice_items -> sale_invoice_items
$content = $content -replace 'purchase_invoice_items','sale_invoice_items'

$content | Set-Content "c:\Users\nesib\.gemini\antigravity\scratch\mobilsayt\web\src\pages\Qaimeler\Satis.tsx" -NoNewline
