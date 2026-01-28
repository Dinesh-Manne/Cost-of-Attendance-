// Storage key for employees
const STORAGE_KEY = 'employees';

// DOM elements
let employeeForm, employeeList, searchInput, emptyState;
let employeeNameInput, employeeRoleInput, employeeRateInput;
let submitBtn, cancelBtn, formTitle, employeeCount;
let exportBtn, importBtn, importFile, backToCalculator, toast;

// Current employees array
let employees = [];

// Edit mode state
let editingEmployeeId = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  employeeForm = document.getElementById('employeeForm');
  employeeList = document.getElementById('employeeList');
  searchInput = document.getElementById('searchInput');
  emptyState = document.getElementById('emptyState');
  
  employeeNameInput = document.getElementById('employeeName');
  employeeRoleInput = document.getElementById('employeeRole');
  employeeRateInput = document.getElementById('employeeRate');
  
  submitBtn = document.getElementById('submitBtn');
  cancelBtn = document.getElementById('cancelBtn');
  formTitle = document.getElementById('formTitle');
  employeeCount = document.getElementById('employeeCount');
  
  exportBtn = document.getElementById('exportBtn');
  importBtn = document.getElementById('importBtn');
  importFile = document.getElementById('importFile');
  backToCalculator = document.getElementById('backToCalculator');
  toast = document.getElementById('toast');
  
  // Event listeners
  employeeForm.addEventListener('submit', handleSubmit);
  cancelBtn.addEventListener('click', cancelEdit);
  searchInput.addEventListener('input', handleSearch);
  exportBtn.addEventListener('click', exportEmployees);
  importBtn.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', importEmployees);
  backToCalculator.addEventListener('click', openCalculator);
  
  // Event delegation for employee action buttons
  employeeList.addEventListener('click', function(e) {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    
    const action = button.dataset.action;
    const employeeId = button.dataset.id;
    
    if (action === 'edit') {
      editEmployee(employeeId);
    } else if (action === 'delete') {
      deleteEmployee(employeeId);
    }
  });
  
  // Load employees from storage
  loadEmployees();
});

// Generate unique ID
function generateId() {
  return 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Load employees from Chrome storage
async function loadEmployees() {
  try {
    // Check if chrome.storage is available
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      throw new Error('Chrome storage API not available');
    }
    
    const result = await chrome.storage.local.get(STORAGE_KEY);
    employees = result[STORAGE_KEY] || [];
    renderEmployees(employees);
    updateCount();
  } catch (error) {
    console.error('Error loading employees:', error);
    showToast('Error loading employees: ' + error.message, 'error');
  }
}

// Save employees to Chrome storage
async function saveEmployees() {
  try {
    // Check if chrome.storage is available
    if (!chrome || !chrome.storage || !chrome.storage.local) {
      throw new Error('Chrome storage API not available. Please reload the extension.');
    }
    
    await chrome.storage.local.set({ [STORAGE_KEY]: employees });
    console.log('Employees saved successfully:', employees);
    return true;
  } catch (error) {
    console.error('Error saving employees:', error);
    showToast('Error saving: ' + error.message, 'error');
    return false;
  }
}

// Handle form submit (add or update employee)
async function handleSubmit(e) {
  e.preventDefault();
  
  const name = employeeNameInput.value.trim();
  const role = employeeRoleInput.value.trim();
  const hourlyRate = parseFloat(employeeRateInput.value);
  
  // Validation
  if (!name || !role || !hourlyRate || hourlyRate <= 0) {
    showToast('Please fill all fields with valid values', 'error');
    return;
  }
  
  if (editingEmployeeId) {
    // Update existing employee
    await updateEmployee(editingEmployeeId, { name, role, hourlyRate });
  } else {
    // Add new employee
    await addEmployee({ name, role, hourlyRate });
  }
}

// Add new employee
async function addEmployee(employeeData) {
  const newEmployee = {
    id: generateId(),
    ...employeeData
  };
  
  employees.push(newEmployee);
  
  if (await saveEmployees()) {
    showToast('Employee added successfully', 'success');
    employeeForm.reset();
    renderEmployees(employees);
    updateCount();
    employeeNameInput.focus();
  }
}

// Update existing employee
async function updateEmployee(id, employeeData) {
  const index = employees.findIndex(emp => emp.id === id);
  
  if (index !== -1) {
    employees[index] = {
      ...employees[index],
      ...employeeData
    };
    
    if (await saveEmployees()) {
      showToast('Employee updated successfully', 'success');
      cancelEdit();
      renderEmployees(employees);
    }
  }
}

// Delete employee
async function deleteEmployee(id) {
  if (!confirm('Are you sure you want to delete this employee?')) {
    return;
  }
  
  // Animate card removal
  const card = document.querySelector(`[data-id="${id}"]`);
  if (card) {
    card.style.opacity = '0';
    card.style.transform = 'translateX(-20px) scale(0.95)';
    card.style.transition = 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)';
    
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  
  employees = employees.filter(emp => emp.id !== id);
  
  if (await saveEmployees()) {
    showToast('Employee deleted successfully', 'success');
    renderEmployees(employees);
    updateCount();
  }
}

// Start editing employee
function editEmployee(id) {
  const employee = employees.find(emp => emp.id === id);
  
  if (employee) {
    editingEmployeeId = id;
    employeeNameInput.value = employee.name;
    employeeRoleInput.value = employee.role;
    employeeRateInput.value = employee.hourlyRate;
    
    formTitle.textContent = 'Edit Employee';
    submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 8l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> Update Employee';
    cancelBtn.style.display = 'inline-flex';
    
    employeeNameInput.focus();
    employeeForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Cancel edit mode
function cancelEdit() {
  editingEmployeeId = null;
  employeeForm.reset();
  formTitle.textContent = 'Add New Employee';
  submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Add Employee';
  cancelBtn.style.display = 'none';
}

// Render employees list
function renderEmployees(employeesToRender) {
  employeeList.innerHTML = '';
  
  if (employeesToRender.length === 0) {
    emptyState.style.display = 'flex';
    return;
  }
  
  emptyState.style.display = 'none';
  
  employeesToRender.forEach((employee, index) => {
    const card = createEmployeeCard(employee);
    // Stagger animation for each card
    card.style.opacity = '0';
    card.style.transform = 'translateY(10px)';
    employeeList.appendChild(card);
    
    // Trigger animation with stagger delay
    setTimeout(() => {
      card.style.transition = 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 50); // 50ms stagger between cards
  });
}

// Create employee card element
function createEmployeeCard(employee) {
  const card = document.createElement('div');
  card.className = 'employee-card';
  card.dataset.id = employee.id;
  
  card.innerHTML = `
    <div class="employee-info">
      <div class="employee-avatar">
        ${getInitials(employee.name)}
      </div>
      <div class="employee-details">
        <h3 class="employee-name">${escapeHtml(employee.name)}</h3>
        <p class="employee-role">${escapeHtml(employee.role)}</p>
      </div>
    </div>
    <div class="employee-rate">
      <span class="rate-amount">$${employee.hourlyRate.toFixed(2)}</span>
      <span class="rate-label">/hour</span>
    </div>
    <div class="employee-actions">
      <button class="btn-icon btn-edit" data-action="edit" data-id="${employee.id}" title="Edit">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.5 2.5l2 2L6 12H4v-2l7.5-7.5z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <button class="btn-icon btn-delete" data-action="delete" data-id="${employee.id}" title="Delete">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M7 7v5M9 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;
  
  return card;
}

// Get initials from name
function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Handle search
function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  
  if (!searchTerm) {
    renderEmployees(employees);
    return;
  }
  
  const filtered = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm) ||
    emp.role.toLowerCase().includes(searchTerm)
  );
  
  renderEmployees(filtered);
}

// Update employee count with animation
function updateCount() {
  const count = employees.length;
  const newText = `${count} employee${count !== 1 ? 's' : ''}`;
  
  // Animate the count change
  if (employeeCount.textContent !== newText) {
    employeeCount.style.transform = 'scale(1.15)';
    employeeCount.style.transition = 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)';
    
    setTimeout(() => {
      employeeCount.textContent = newText;
      employeeCount.style.transform = 'scale(1)';
    }, 100);
  }
}

// Export employees to CSV (Excel-compatible)
function exportEmployees() {
  if (employees.length === 0) {
    showToast('No employees to export', 'error');
    return;
  }
  
  // Create CSV header
  let csvContent = 'Name,Role,Hourly Rate\n';
  
  // Add employee data
  employees.forEach(emp => {
    // Escape commas and quotes in data
    const name = `"${emp.name.replace(/"/g, '""')}"`;
    const role = `"${emp.role.replace(/"/g, '""')}"`;
    const rate = emp.hourlyRate;
    csvContent += `${name},${role},${rate}\n`;
  });
  
  // Create blob and download
  const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  URL.revokeObjectURL(url);
  showToast('Employees exported to CSV', 'success');
}

// Import employees from CSV
async function importEmployees(e) {
  const file = e.target.files[0];
  
  if (!file) return;
  
  // Check file extension
  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
    showToast('Please upload a CSV file (.csv)', 'error');
    importFile.value = '';
    return;
  }
  
  const reader = new FileReader();
  
  reader.onload = async function(event) {
    try {
      const text = event.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        showToast('File is empty or invalid', 'error');
        return;
      }
      
      // Parse CSV
      const importedData = [];
      
      // Skip header line (first line)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV line (handle quoted values with commas)
        const values = parseCSVLine(line);
        
        if (values.length >= 3) {
          const name = values[0].trim();
          const role = values[1].trim();
          const hourlyRate = parseFloat(values[2]);
          
          if (name && role && !isNaN(hourlyRate) && hourlyRate > 0) {
            importedData.push({
              id: generateId(),
              name: name,
              role: role,
              hourlyRate: hourlyRate
            });
          }
        }
      }
      
      if (importedData.length === 0) {
        showToast('No valid employee data found in file', 'error');
        return;
      }
      
      // Add to existing employees
      employees = [...employees, ...importedData];
      
      if (await saveEmployees()) {
        showToast(`Imported ${importedData.length} employee(s)`, 'success');
        renderEmployees(employees);
        updateCount();
      }
    } catch (error) {
      console.error('Import error:', error);
      showToast('Error importing file: ' + error.message, 'error');
    }
    
    // Reset file input
    importFile.value = '';
  };
  
  reader.readAsText(file);
}

// Parse CSV line handling quoted values
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Check for escaped quote
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last value
  values.push(current);
  
  return values;
}

// Open calculator popup
function openCalculator(e) {
  e.preventDefault();
  // Close this tab and open the extension popup by clicking the icon
  // Or redirect to popup.html
  window.location.href = 'popup.html';
}

// Show toast notification
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}
