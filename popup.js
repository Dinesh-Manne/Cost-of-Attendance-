document.addEventListener('DOMContentLoaded', function() {
  const attendeesList = document.getElementById('attendeesList');
  const addAttendeeBtn = document.getElementById('addAttendeeBtn');
  const durationInput = document.getElementById('duration');
  const meetingNameInput = document.getElementById('meetingName');
  const resultDiv = document.getElementById('result');
  const costAmount = document.getElementById('costAmount');
  const totalHourlyRate = document.getElementById('totalHourlyRate');
  const costPerMinute = document.getElementById('costPerMinute');
  const presetButtons = document.querySelectorAll('.preset-btn');
  const copySummaryBtn = document.getElementById('copySummaryBtn');
  const copySuccessMessage = document.getElementById('copySuccessMessage');
  
  let attendeeCount = 0;
  
  // Preset role button handlers
  presetButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      const role = this.dataset.role;
      const rate = parseFloat(this.dataset.rate);
      addAttendee(role, rate);
    });
  });
  
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
  
  function addAttendee(name = '', rate = '') {
    attendeeCount++;
    const attendeeItem = document.createElement('div');
    attendeeItem.className = 'attendee-item';
    attendeeItem.dataset.id = attendeeCount;
    
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
      attendeeItem.style.opacity = '0';
      attendeeItem.style.transform = 'translateX(-10px)';
      setTimeout(() => {
        attendeeItem.remove();
        calculateCost();
      }, 200);
    }
  }
  
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
      costAmount.textContent = formatCurrency(0);
      totalHourlyRate.textContent = formatCurrency(totalRate);
      costPerMinute.textContent = formatCurrency(totalRate / 60);
      return;
    }
    
    if (validAttendees === 0) {
      // No valid attendees
      costAmount.textContent = formatCurrency(0);
      totalHourlyRate.textContent = formatCurrency(0);
      costPerMinute.textContent = formatCurrency(0);
      return;
    }
    
    // Calculate total cost
    const durationInHours = duration / 60;
    const totalCost = totalRate * durationInHours;
    const costPerMin = totalRate / 60;
    
    // Display results
    costAmount.textContent = formatCurrency(totalCost);
    totalHourlyRate.textContent = formatCurrency(totalRate);
    costPerMinute.textContent = formatCurrency(costPerMin);
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
  
  // Initial calculation
  calculateCost();
});
