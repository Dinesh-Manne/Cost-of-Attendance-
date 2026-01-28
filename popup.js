document.addEventListener('DOMContentLoaded', function() {
  const attendeesList = document.getElementById('attendeesList');
  const addAttendeeBtn = document.getElementById('addAttendeeBtn');
  const durationInput = document.getElementById('duration');
  const meetingNameInput = document.getElementById('meetingName');
  const resultDiv = document.getElementById('result');
  const costAmount = document.getElementById('costAmount');
  const totalHourlyRate = document.getElementById('totalHourlyRate');
  const costPerMinute = document.getElementById('costPerMinute');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const copySuccessMessage = document.getElementById('copySuccessMessage');
  const employeeCheckboxes = document.getElementById('employeeCheckboxes');
  const noEmployeesMessage = document.getElementById('noEmployeesMessage');
  
  let attendeeCount = 0;
  let employees = [];
  const selectedEmployeeIds = new Set();
  
  // Load employee directory from storage
  loadEmployeeDirectory();
  
  // Listen for employee checkbox changes
  if (employeeCheckboxes) {
    employeeCheckboxes.addEventListener('change', handleEmployeeCheckboxChange);
  }
  
  // Add custom attendee button click handler
  addAttendeeBtn.addEventListener('click', function() {
    addAttendee();
  });
  
  // Listen for duration changes
  durationInput.addEventListener('input', function() {
    calculateCost();
  });
  
  // Listen for changes in attendee inputs (delegated event handling)
  attendeesList.addEventListener('input', function(e) {
    if (e.target.classList.contains('attendee-name') || e.target.classList.contains('attendee-rate')) {
      calculateCost();
    }
  });
  
  // Listen for remove button clicks (delegated event handling)
  attendeesList.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-remove') || e.target.closest('.btn-remove')) {
      const btn = e.target.classList.contains('btn-remove') ? e.target : e.target.closest('.btn-remove');
      removeAttendee(btn.closest('.attendee-item'));
    }
  });
  
  // Copy summary button handler
  copySummaryBtn.addEventListener('click', function() {
    copySummary();
  });
  
  function addAttendee(name = '', rate = '', employeeId = null) {
    attendeeCount++;
    const attendeeItem = document.createElement('div');
    attendeeItem.className = 'attendee-item';
    attendeeItem.dataset.id = attendeeCount;
    if (employeeId) {
      attendeeItem.dataset.employeeId = employeeId;
    }
    
    attendeeItem.innerHTML = `
      <div class="attendee-info">
        <div class="attendee-details">
          <div class="attendee-name-display">
            <span class="attendee-name-text">${name || 'Attendee ' + attendeeCount}</span>
          </div>
          <div class="attendee-rate-display">
            <span class="rate-label">Rate:</span>
            <span class="rate-value">$${rate || '0'}/hr</span>
          </div>
        </div>
        <button type="button" class="btn-remove" data-id="${attendeeCount}" aria-label="Remove attendee">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="attendee-edit-form">
        <div class="form-row">
          <div class="form-field">
            <label for="attendee-name-${attendeeCount}">Name</label>
            <input 
              type="text" 
              id="attendee-name-${attendeeCount}"
              class="attendee-name" 
              value="${name}"
              data-id="${attendeeCount}"
            >
          </div>
          <div class="form-field">
            <label for="attendee-rate-${attendeeCount}">Hourly Rate ($)</label>
            <input 
              type="number" 
              id="attendee-rate-${attendeeCount}"
              class="attendee-rate" 
              value="${rate}"
              min="0" 
              step="0.01"
              data-id="${attendeeCount}"
            >
          </div>
        </div>
      </div>
    `;
    
    attendeesList.appendChild(attendeeItem);
    
    // Update display when inputs change
    const nameInput = attendeeItem.querySelector('.attendee-name');
    const rateInput = attendeeItem.querySelector('.attendee-rate');
    const nameDisplay = attendeeItem.querySelector('.attendee-name-text');
    const rateDisplay = attendeeItem.querySelector('.rate-value');
    
    function updateDisplay() {
      const name = nameInput.value.trim() || 'Attendee ' + attendeeCount;
      const rate = parseFloat(rateInput.value) || 0;
      nameDisplay.textContent = name;
      rateDisplay.textContent = '$' + (rate || '0') + '/hr';
      calculateCost();
    }
    
    nameInput.addEventListener('input', updateDisplay);
    rateInput.addEventListener('input', updateDisplay);
    
    // Focus on the name input if it's empty
    if (!name) {
      nameInput.focus();
    } else {
      rateInput.focus();
    }
    
    // Initial calculation
    calculateCost();
  }
  
  function removeAttendee(attendeeItem) {
    if (attendeeItem) {
      // Uncheck corresponding employee checkbox if this was from directory
      const employeeId = attendeeItem.dataset.employeeId;
      if (employeeId) {
        selectedEmployeeIds.delete(employeeId);
        const checkbox = employeeCheckboxes.querySelector(`[data-id="${employeeId}"]`);
        if (checkbox) {
          checkbox.checked = false;
        }
      }
      
      attendeeItem.style.opacity = '0';
      attendeeItem.style.transform = 'translateX(-10px)';
      setTimeout(() => {
        attendeeItem.remove();
        calculateCost();
      }, 200);
    }
  }
  
  // Store previous values for smooth animation
  let prevTotalCost = 0;
  let prevTotalRate = 0;
  let prevCostPerMin = 0;
  
  function calculateCost() {
    // Get all attendees
    const attendeeItems = attendeesList.querySelectorAll('.attendee-item');
    
    // Get duration
    const duration = parseFloat(durationInput.value) || 0;
    
    // Calculate total hourly rate from all attendees
    let totalRate = 0;
    let validAttendees = 0;
    
    attendeeItems.forEach(item => {
      const rateInput = item.querySelector('.attendee-rate');
      const rate = parseFloat(rateInput.value) || 0;
      
      // Only count attendees with valid rates
      if (rate > 0) {
        totalRate += rate;
        validAttendees++;
      }
    });
    
    // Handle edge cases
    if (duration <= 0) {
      // If duration is 0 or invalid, show hourly rate only
      animateValue(costAmount, prevTotalCost, 0, 600);
      animateValue(totalHourlyRate, prevTotalRate, totalRate, 600);
      animateValue(costPerMinute, prevCostPerMin, totalRate / 60, 600);
      
      prevTotalCost = 0;
      prevTotalRate = totalRate;
      prevCostPerMin = totalRate / 60;
      return;
    }
    
    if (validAttendees === 0) {
      // No valid attendees
      animateValue(costAmount, prevTotalCost, 0, 600);
      animateValue(totalHourlyRate, prevTotalRate, 0, 600);
      animateValue(costPerMinute, prevCostPerMin, 0, 600);
      
      prevTotalCost = 0;
      prevTotalRate = 0;
      prevCostPerMin = 0;
      return;
    }
    
    // Calculate total cost
    const durationInHours = duration / 60;
    const totalCost = totalRate * durationInHours;
    const costPerMin = totalRate / 60;
    
    // Animate results with smooth transitions
    animateValue(costAmount, prevTotalCost, totalCost, 600);
    animateValue(totalHourlyRate, prevTotalRate, totalRate, 600);
    animateValue(costPerMinute, prevCostPerMin, costPerMin, 600);
    
    // Update previous values
    prevTotalCost = totalCost;
    prevTotalRate = totalRate;
    prevCostPerMin = costPerMin;
  }
  
  // Animate number changes smoothly
  function animateValue(element, start, end, duration) {
    // Cancel any existing animation on this element
    if (element.animationFrame) {
      cancelAnimationFrame(element.animationFrame);
    }
    
    const startTime = performance.now();
    const range = end - start;
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out cubic)
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      const current = start + (range * easeProgress);
      element.textContent = formatCurrency(current);
      
      if (progress < 1) {
        element.animationFrame = requestAnimationFrame(update);
      }
    }
    
    element.animationFrame = requestAnimationFrame(update);
  }
  
  function formatCurrency(amount) {
    // Handle NaN and invalid values
    if (isNaN(amount) || !isFinite(amount)) {
      amount = 0;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  function formatCurrencyPlain(amount) {
    // Handle NaN and invalid values
    if (isNaN(amount) || !isFinite(amount)) {
      amount = 0;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  function generateSummary() {
    const meetingName = (meetingNameInput.value || '').trim();
    const duration = parseFloat(durationInput.value) || 0;
    const attendeeItems = attendeesList.querySelectorAll('.attendee-item');
    
    // Get attendees with valid rates
    const attendees = [];
    let totalRate = 0;
    
    attendeeItems.forEach(item => {
      const nameInput = item.querySelector('.attendee-name');
      const rateInput = item.querySelector('.attendee-rate');
      const name = (nameInput.value || '').trim() || 'Unnamed';
      const rate = parseFloat(rateInput.value) || 0;
      
      if (rate > 0) {
        attendees.push({ name, rate });
        totalRate += rate;
      }
    });
    
    // Calculate costs
    const durationInHours = duration / 60;
    const totalCost = totalRate * durationInHours;
    const costPerMin = totalRate / 60;
    
    // Build summary text
    let summary = 'Meeting Cost Summary\n';
    summary += '='.repeat(30) + '\n\n';
    
    if (meetingName) {
      summary += `Meeting: ${meetingName}\n\n`;
    }
    
    summary += `Duration: ${duration} minutes\n`;
    summary += `Duration: ${(duration / 60).toFixed(2)} hours\n\n`;
    
    summary += 'Attendees:\n';
    if (attendees.length === 0) {
      summary += '  No attendees added\n';
    } else {
      attendees.forEach((attendee, index) => {
        summary += `  ${index + 1}. ${attendee.name} - ${formatCurrencyPlain(attendee.rate)}/hr\n`;
      });
    }
    
    summary += '\n';
    summary += `Total Hourly Rate: ${formatCurrencyPlain(totalRate)}\n`;
    summary += `Cost per Minute: ${formatCurrencyPlain(costPerMin)}\n`;
    summary += `Total Meeting Cost: ${formatCurrencyPlain(totalCost)}\n`;
    
    return summary;
  }
  
  async function copySummary() {
    try {
      const summary = generateSummary();
      await navigator.clipboard.writeText(summary);
      
      // Show success message
      copySuccessMessage.classList.remove('hidden');
      copySummaryBtn.classList.add('copied');
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        copySuccessMessage.classList.add('hidden');
        copySummaryBtn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy summary:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = generateSummary();
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        copySuccessMessage.classList.remove('hidden');
        setTimeout(() => {
          copySuccessMessage.classList.add('hidden');
        }, 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  }
  
  // Load employee directory from storage
  async function loadEmployeeDirectory() {
    try {
      const result = await chrome.storage.local.get('employees');
      employees = result.employees || [];
      renderEmployeeCheckboxes();
    } catch (error) {
      console.error('Error loading employees:', error);
      employees = [];
      renderEmployeeCheckboxes();
    }
  }
  
  // Render employee checkboxes
  function renderEmployeeCheckboxes() {
    if (!employeeCheckboxes) return;
    
    employeeCheckboxes.innerHTML = '';
    
    if (employees.length === 0) {
      noEmployeesMessage.style.display = 'block';
      employeeCheckboxes.style.display = 'none';
      return;
    }
    
    noEmployeesMessage.style.display = 'none';
    employeeCheckboxes.style.display = 'grid';
    
    employees.forEach(employee => {
      const checkboxItem = document.createElement('label');
      checkboxItem.className = 'employee-checkbox-item';
      
      checkboxItem.innerHTML = `
        <input 
          type="checkbox" 
          class="employee-checkbox" 
          data-id="${employee.id}"
          data-name="${escapeAttr(employee.name)}"
          data-role="${escapeAttr(employee.role)}"
          data-rate="${employee.hourlyRate}"
        >
        <div class="employee-checkbox-info">
          <span class="employee-checkbox-name">${escapeHtml(employee.name)}</span>
          <span class="employee-checkbox-rate">$${employee.hourlyRate}/hr</span>
        </div>
      `;
      
      employeeCheckboxes.appendChild(checkboxItem);
    });
  }
  
  // Handle employee checkbox change
  function handleEmployeeCheckboxChange(e) {
    if (!e.target.classList.contains('employee-checkbox')) return;
    
    const checkbox = e.target;
    const employeeId = checkbox.dataset.id;
    const name = checkbox.dataset.name;
    const rate = parseFloat(checkbox.dataset.rate);
    
    if (checkbox.checked) {
      // Add employee to selected set
      selectedEmployeeIds.add(employeeId);
      // Add to meeting
      addEmployeeToMeeting(name, rate, employeeId);
    } else {
      // Remove employee from selected set
      selectedEmployeeIds.delete(employeeId);
      // Remove from meeting
      removeEmployeeFromMeeting(employeeId);
    }
  }
  
  // Add employee to meeting attendees
  function addEmployeeToMeeting(name, rate, employeeId) {
    addAttendee(name, rate, employeeId);
  }
  
  // Remove employee from meeting attendees
  function removeEmployeeFromMeeting(employeeId) {
    const attendeeItem = attendeesList.querySelector(`[data-employee-id="${employeeId}"]`);
    if (attendeeItem) {
      attendeeItem.remove();
      calculateCost();
    }
  }
  
  // Escape HTML for security
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // Escape attribute for security
  function escapeAttr(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  
  // Initial calculation
  calculateCost();
});
