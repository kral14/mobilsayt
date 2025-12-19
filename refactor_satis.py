
import os

file_path = r"c:\Users\nesib\Desktop\mobilsayt\web\src\pages\Qaimeler\Satis.tsx"
backup_path = r"c:\Users\nesib\Desktop\mobilsayt\web\src\pages\Qaimeler\Satis.tsx.bak_script"

# Read file
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Create backup
with open(backup_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

new_lines = []
in_datatable = False
datatable_removed = False

# Imports block to replace DataTable import
universal_imports = """import UniversalContainer from '../../components/UniversalContainer'
import UniversalNavbar from '../../components/UniversalNavbar'
import UniversalTable, { ColumnConfig } from '../../components/UniversalTable'
// UniversalFooter imported below
"""

universal_content = """      <UniversalNavbar
        onAdd={async () => {
          await openModalForInvoice(null)
        }}
        onEdit={() => {
          if (selectedInvoiceIds.length === 1) {
            handleEdit(selectedInvoiceIds)
          }
        }}
        onDelete={() => {
          if (selectedInvoiceIds.length > 0) {
            handleDelete(selectedInvoiceIds)
          }
        }}
        onCopy={() => {
            if (selectedInvoiceIds.length > 0) {
              handleCopy(selectedInvoiceIds)
            }
        }}
        onPrint={handlePrint}
        onRefresh={loadInvoices}
        onSettings={() => { }}
        onSearch={handleSearch}
        onFilter={() => setShowFilterModal(true)}
      />

      {/* Aktiv filtrlər */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 15px', flexWrap: 'wrap', marginBottom: '10px' }}>
        {activeFilters.map((filter, index) => {
          let label = ''
          let value = ''

          if (filter.columnId === 'customer_id') {
            const customer = customers.find(c => c.id === Number(filter.value))
            label = 'Müştəri'
            value = customer ? customer.name : filter.value
          } else if (filter.columnId === 'product_id') {
            if (Array.isArray(filter.value)) {
              label = 'Məhsul'
              value = `${filter.value.length} məhsul`
            }
          } else {
            label = defaultColumns.find(c => c.id === filter.columnId)?.label || filter.columnId
            value = filter.value.toString()
          }

          return (
            <div
              key={index}
              style={{
                background: '#e9ecef',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #ced4da'
              }}
            >
              <span style={{ fontWeight: 500 }}>{label}:</span>
              <span>{value}</span>
              <button
                onClick={() => {
                  const newFilters = activeFilters.filter((_, i) => i !== index)
                  setActiveFilters(newFilters)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc3545',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0',
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      <UniversalTable
        data={tableData}
        columns={defaultColumns}
        loading={loading}
        getRowId={(row: any) => row.id}
        onRowSelect={setSelectedInvoiceIds}
        onRowClick={(row: any) => handleEdit([row.id])}
      />

      <UniversalFooter
        totalRecords={tableData.length}
        selectedCount={selectedInvoiceIds.length}
      />
"""

processed_lines = []
for line in lines:
    stripped = line.strip()

    # Import replacement
    if "import DataTable" in line and "from '../../components/DataTable'" in line:
        processed_lines.append(universal_imports)
        continue
    
    # Replace outer div with UniversalContainer
    # Searching for main render block
    if "return (" in line:
        processed_lines.append(line)
        continue
    
    # The div inside return (lines ~1819)
    # <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    if "<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>" in line or (len(processed_lines) > 0 and "return (" in processed_lines[-1] and "<div" in line):
        processed_lines.append("    <UniversalContainer>\n")
        continue

    # Identify DataTable block
    if "<DataTable" in stripped:
        in_datatable = True
        continue
    
    if in_datatable:
        if "/>" in stripped and "  />" in line: # End of DataTable (indented)
             # Satis.tsx uses indented />. I'll rely on loose matching but ensuring "/>" is line content.
             # Wait, in Alis.tsx I checked "  />" in line. Satis.tsx might differ.
             # Satis.tsx view showed:
             # 1821:       <DataTable
             # ...
             # It will end with />.
             in_datatable = False
             processed_lines.append(universal_content)
        continue

    # Closing div of the component
    if "</div>" in stripped:
        # Check if it is the closing div of the return block
        # In Satis.tsx it ends with:
        # 3825:     </div>
        # 3826:   )
        if line.startswith("    </div>"):
             processed_lines.append("    </UniversalContainer>\n")
             continue

    processed_lines.append(line)

# Write result
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(processed_lines)

print("Refactoring Satis.tsx completed.")
