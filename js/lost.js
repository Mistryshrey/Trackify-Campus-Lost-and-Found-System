// Lost Item Form Handling with Database Connection

document.addEventListener('DOMContentLoaded', function() {
    initializeLostForm();
    setupLostFormValidation();
    setupCategorySelection();
});

function initializeLostForm() {
    console.log('Initializing Lost Item Form');
    
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    const timeString = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const dateInput = document.getElementById('lostDate');
    const timeInput = document.getElementById('lostTime');
    
    if (dateInput) dateInput.value = dateString;
    if (timeInput) timeInput.value = timeString;
    
    if (appUtils) {
        appUtils.setupFileUpload('itemImage', 'imagePreview');
    }
    
    setupFormSteps();
    setupCategorySpecificFields();
}

function setupFormSteps() {
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const formSections = document.querySelectorAll('.form-section');
    
    let currentStep = 0;
    showStep(currentStep);
    
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentSection = this.closest('.form-section');
            const stepIndex = Array.from(formSections).indexOf(currentSection);
            
            if (validateStep(stepIndex)) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentStep--;
            showStep(currentStep);
        });
    });
}

function showStep(stepIndex) {
    const formSections = document.querySelectorAll('.form-section');
    const steps = document.querySelectorAll('.step');
    
    formSections.forEach(section => section.classList.remove('active'));
    
    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index === stepIndex) {
            step.classList.add('active');
        } else if (index < stepIndex) {
            step.classList.add('completed');
        }
    });
    
    if (formSections[stepIndex]) {
        formSections[stepIndex].classList.add('active');
        formSections[stepIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    if (stepIndex === formSections.length - 1) {
        populateReviewSection();
    }
}

function validateStep(stepIndex) {
    let isValid = true;
    
    switch (stepIndex) {
        case 0:
            isValid = validateBasicInfo();
            break;
        case 1:
            isValid = validateDetails();
            break;
        case 2:
            isValid = validateLocationContact();
            break;
    }
    
    if (!isValid) {
        appUtils.showNotification('Please fill in all required fields correctly', 'error');
    }
    
    return isValid;
}

function validateBasicInfo() {
    const category = document.querySelector('.category-option.selected');
    const itemName = document.getElementById('itemName').value.trim();
    
    let isValid = true;
    
    if (!category) {
        document.querySelector('.category-select').style.border = '2px solid var(--accent-color)';
        isValid = false;
    } else {
        document.querySelector('.category-select').style.border = '';
    }
    
    if (!itemName) {
        document.getElementById('itemName').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('itemName').closest('.form-group').classList.remove('error');
    }
    
    return isValid;
}

function validateDetails() {
    const description = document.getElementById('itemDescription').value.trim();
    const color = document.getElementById('itemColor').value.trim();
    
    let isValid = true;
    
    if (!description) {
        document.getElementById('itemDescription').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('itemDescription').closest('.form-group').classList.remove('error');
    }
    
    if (!color) {
        document.getElementById('itemColor').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('itemColor').closest('.form-group').classList.remove('error');
    }
    
    return isValid;
}

function validateLocationContact() {
    const location = document.getElementById('lostLocation').value.trim();
    const date = document.getElementById('lostDate').value;
    const contactName = document.getElementById('contactName').value.trim();
    const contactEmail = document.getElementById('contactEmail').value.trim();
    
    let isValid = true;
    
    if (!location) {
        document.getElementById('lostLocation').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('lostLocation').closest('.form-group').classList.remove('error');
    }
    
    if (!date) {
        document.getElementById('lostDate').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('lostDate').closest('.form-group').classList.remove('error');
    }
    
    if (!contactName) {
        document.getElementById('contactName').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('contactName').closest('.form-group').classList.remove('error');
    }
    
    if (!contactEmail || !appUtils.validateEmail(contactEmail)) {
        document.getElementById('contactEmail').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('contactEmail').closest('.form-group').classList.remove('error');
    }
    
    return isValid;
}

function setupCategorySelection() {
    const categoryOptions = document.querySelectorAll('.category-option');
    
    categoryOptions.forEach(option => {
        option.addEventListener('click', function() {
            categoryOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            this.closest('.form-section').dataset.selectedCategory = this.dataset.category;
            
            // Show category-specific fields
            const category = this.dataset.category;
            showCategorySpecificFields(category);
        });
    });
}

function setupCategorySpecificFields() {
    // Create the dynamic fields container if it doesn't exist
    if (!document.getElementById('categorySpecificFields')) {
        const step2 = document.getElementById('step2');
        const insertPoint = document.getElementById('itemColor').closest('.form-group').nextSibling;
        
        const fieldsHTML = `
            <div id="categorySpecificFields" style="display: none;">
                <div id="documentsFields" class="category-fields" style="display: none;">
                    <div class="form-group">
                        <label for="enrollmentNumber" class="required">📋 Enrollment Number (on your ID card)</label>
                        <input type="text" id="enrollmentNumber" class="form-control" placeholder="e.g., 2024CS001" maxlength="20">
                        <div class="error-message">Please enter your enrollment number</div>
                    </div>
                </div>
                
                <div id="electronicsFields" class="category-fields" style="display: none;">
                    <div class="form-group">
                        <label for="imeiLastFour" class="required">📱 Last 4 digits of IMEI number</label>
                        <input type="text" id="imeiLastFour" class="form-control" placeholder="Last 4 digits" maxlength="4">
                        <div class="error-message">Please enter last 4 digits of IMEI</div>
                    </div>
                </div>
                
                <div id="keysFields" class="category-fields" style="display: none;">
                    <div class="form-group">
                        <label for="keyCount" class="required">🔑 How many keys on the keyring?</label>
                        <input type="number" id="keyCount" class="form-control" placeholder="Number of keys" min="1" max="20">
                        <div class="error-message">Please enter number of keys</div>
                    </div>
                </div>
                
                <div id="genericSecretField" style="display: none;">
                    <div class="form-group">
                        <label for="genericSecret" class="required">🔐 Unique detail about your item</label>
                        <input type="text" id="genericSecret" class="form-control" placeholder="e.g., Has a scratch, Sticker on back, Name written inside">
                        <div class="error-message">Please provide a unique detail</div>
                    </div>
                </div>
            </div>
        `;
        
        if (insertPoint && step2) {
            step2.insertAdjacentHTML('beforeend', fieldsHTML);
        }
    }
}

function showCategorySpecificFields(category) {
    const container = document.getElementById('categorySpecificFields');
    if (!container) return;
    
    // Hide all
    document.querySelectorAll('.category-fields').forEach(field => field.style.display = 'none');
    document.getElementById('genericSecretField').style.display = 'none';
    
    // Show based on category
    switch(category) {
        case 'documents':
            document.getElementById('documentsFields').style.display = 'block';
            break;
        case 'electronics':
            document.getElementById('electronicsFields').style.display = 'block';
            break;
        case 'keys':
            document.getElementById('keysFields').style.display = 'block';
            break;
        default:
            document.getElementById('genericSecretField').style.display = 'block';
            break;
    }
    
    container.style.display = 'block';
}

function populateReviewSection() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;
    
    const category = document.querySelector('.category-option.selected')?.dataset.category || 'Not selected';
    const itemName = document.getElementById('itemName').value;
    const description = document.getElementById('itemDescription').value;
    const color = document.getElementById('itemColor').value;
    const brand = document.getElementById('itemBrand').value;
    const model = document.getElementById('itemModel').value;
    const location = document.getElementById('lostLocation').value;
    const date = document.getElementById('lostDate').value;
    const time = document.getElementById('lostTime').value;
    const contactName = document.getElementById('contactName').value;
    const contactEmail = document.getElementById('contactEmail').value;
    const contactPhone = document.getElementById('contactPhone').value;
    const additionalInfo = document.getElementById('additionalInfo').value;
    
    reviewContent.innerHTML = `
        <div class="review-section">
            <h4>Item Information</h4>
            <div class="review-grid">
                <div class="review-item"><strong>Category:</strong> <span>${category}</span></div>
                <div class="review-item"><strong>Item Name:</strong> <span>${itemName}</span></div>
                <div class="review-item"><strong>Description:</strong> <span>${description || 'Not provided'}</span></div>
                <div class="review-item"><strong>Color:</strong> <span>${color || 'Not provided'}</span></div>
                <div class="review-item"><strong>Brand/Model:</strong> <span>${brand || 'Not specified'} ${model || ''}</span></div>
            </div>
        </div>
        <div class="review-section">
            <h4>Loss Details</h4>
            <div class="review-grid">
                <div class="review-item"><strong>Location:</strong> <span>${location}</span></div>
                <div class="review-item"><strong>Date & Time:</strong> <span>${date} at ${time}</span></div>
            </div>
        </div>
        <div class="review-section">
            <h4>Contact Information</h4>
            <div class="review-grid">
                <div class="review-item"><strong>Name:</strong> <span>${contactName}</span></div>
                <div class="review-item"><strong>Email:</strong> <span>${contactEmail}</span></div>
                <div class="review-item"><strong>Phone:</strong> <span>${contactPhone || 'Not provided'}</span></div>
            </div>
        </div>
        ${additionalInfo ? `<div class="review-section"><h4>Additional Information</h4><p>${additionalInfo}</p></div>` : ''}
    `;
}

function setupLostFormValidation() {
    const lostForm = document.getElementById('lostItemForm');
    if (lostForm) {
        lostForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitLostItem();
        });
    }
    
    const emailInput = document.getElementById('contactEmail');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            if (this.value && !appUtils.validateEmail(this.value)) {
                this.closest('.form-group').classList.add('error');
            } else {
                this.closest('.form-group').classList.remove('error');
            }
        });
    }
}

// 🔐 MAIN SUBMIT FUNCTION - Connects to PHP Database
function submitLostItem() {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) {
        appUtils.showNotification('Please complete all form sections correctly', 'error');
        showStep(0);
        return;
    }
    
    const category = document.querySelector('.category-option.selected').dataset.category;
    
    // Get verification data based on category
    let verificationType = 'generic';
    let verificationQuestion = 'Describe a unique detail about your item';
    let verificationAnswer = '';
    
    switch(category) {
        case 'documents':
            verificationType = 'enrollment';
            verificationAnswer = document.getElementById('enrollmentNumber').value.trim();
            verificationQuestion = 'What is your enrollment number?';
            if (!verificationAnswer) {
                appUtils.showNotification('Please enter your enrollment number', 'error');
                return;
            }
            break;
        case 'electronics':
            verificationType = 'imei';
            verificationAnswer = document.getElementById('imeiLastFour').value.trim();
            verificationQuestion = 'What are the last 4 digits of your IMEI?';
            if (!verificationAnswer || verificationAnswer.length !== 4) {
                appUtils.showNotification('Please enter last 4 digits of IMEI', 'error');
                return;
            }
            break;
        case 'keys':
            verificationType = 'key_count';
            verificationAnswer = document.getElementById('keyCount').value;
            verificationQuestion = 'How many keys on your keyring?';
            if (!verificationAnswer) {
                appUtils.showNotification('Please enter number of keys', 'error');
                return;
            }
            break;
        default:
            verificationType = 'generic';
            verificationAnswer = document.getElementById('genericSecret')?.value.trim() || '';
            // If empty, use description as fallback verification
            if (!verificationAnswer) {
                verificationAnswer = document.getElementById('itemDescription')?.value.trim() || 'not provided';
            }
            verificationQuestion = 'Describe a unique detail about your item';
            break;
    }
    
    // Get image as base64 if exists
    let imageBase64 = '';
    const imagePreview = document.getElementById('imagePreview');
    const imgElement = imagePreview?.querySelector('img');
    if (imgElement && imgElement.src) {
        imageBase64 = imgElement.src;
    }
    
    // Build data for API
    const formData = {
        category: category,
        item_name: document.getElementById('itemName').value.trim(),
        description: document.getElementById('itemDescription').value.trim(),
        color: document.getElementById('itemColor').value.trim(),
        brand: document.getElementById('itemBrand').value.trim(),
        model: document.getElementById('itemModel').value.trim(),
        location: document.getElementById('lostLocation').value.trim(),
        date: document.getElementById('lostDate').value,
        time: document.getElementById('lostTime').value,
        contact_name: document.getElementById('contactName').value.trim(),
        contact_email: document.getElementById('contactEmail').value.trim(),
        contact_phone: document.getElementById('contactPhone').value.trim(),
        additional_info: document.getElementById('additionalInfo').value.trim(),
        image: imageBase64,
        verification_type: verificationType,
        verification_question: verificationQuestion,
        verification_answer: verificationAnswer
    };
    
    // Show loading state
    const submitBtn = document.querySelector('#step4 .btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    // 🔐 SEND TO PHP DATABASE
    fetch('php/save_lost.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        if (data.success) {
            console.log('Item saved to database! ID:', data.item_id);
            showConfirmation(data.verification_code);
            appUtils.showNotification('Lost item reported successfully!', 'success');
            
            // Clear form
            document.getElementById('lostItemForm').reset();
        } else {
            appUtils.showNotification('Error: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        console.error('Fetch error:', error);
        // Check if XAMPP is running by testing the PHP path
        appUtils.showNotification(
            'Could not reach server. Check: 1) XAMPP is running 2) You are on http://localhost/trackify/lost.html (not file://)', 
            'error'
        );
    });
}

function showConfirmation(verificationCode) {
    const confirmationSection = document.getElementById('confirmationSection');
    const formSections = document.querySelectorAll('.form-section');
    
    formSections.forEach(section => {
        section.style.display = 'none';
    });
    
    if (confirmationSection) {
        confirmationSection.style.display = 'block';
        document.getElementById('confirmationCode').textContent = verificationCode;
        confirmationSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    if (typeof updateStats === 'function') {
        updateStats();
    }
}

function triggerMatching() {
    if (typeof findMatches === 'function') {
        findMatches();
    } else {
        console.log('Matching algorithm not loaded yet');
    }
}