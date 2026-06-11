// Found Item Form Handling with Database Connection

document.addEventListener('DOMContentLoaded', function() {
    initializeFoundForm();
    setupFoundFormValidation();
    setupFoundCategorySelection();
    setupStorageLocation();
});

function initializeFoundForm() {
    console.log('Initializing Found Item Form');
    
    const now = new Date();
    const dateString = now.toISOString().split('T')[0];
    const timeString = now.toTimeString().split(' ')[0].substring(0, 5);
    
    const dateInput = document.getElementById('foundDate');
    const timeInput = document.getElementById('foundTime');
    
    if (dateInput) dateInput.value = dateString;
    if (timeInput) timeInput.value = timeString;
    
    if (appUtils) {
        appUtils.setupFileUpload('foundItemImage', 'foundImagePreview');
    }
    
    setupFoundFormSteps();
}

function setupFoundFormSteps() {
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    const formSections = document.querySelectorAll('.form-section');
    
    let currentStep = 0;
    showFoundStep(currentStep);
    
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentSection = this.closest('.form-section');
            const stepIndex = Array.from(formSections).indexOf(currentSection);
            
            if (validateFoundStep(stepIndex)) {
                currentStep++;
                showFoundStep(currentStep);
            }
        });
    });
    
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            currentStep--;
            showFoundStep(currentStep);
        });
    });
}

function showFoundStep(stepIndex) {
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
        populateFoundReviewSection();
    }
}

function validateFoundStep(stepIndex) {
    let isValid = true;
    
    switch (stepIndex) {
        case 0:
            isValid = validateFoundBasicInfo();
            break;
        case 1:
            isValid = validateFoundDetails();
            break;
        case 2:
            isValid = validateFoundLocationContact();
            break;
    }
    
    if (!isValid) {
        appUtils.showNotification('Please fill in all required fields correctly', 'error');
    }
    
    return isValid;
}

function validateFoundBasicInfo() {
    const category = document.querySelector('.category-option.selected');
    const itemName = document.getElementById('foundItemName').value.trim();
    
    let isValid = true;
    
    if (!category) {
        document.querySelector('.category-select').style.border = '2px solid var(--accent-color)';
        isValid = false;
    } else {
        document.querySelector('.category-select').style.border = '';
    }
    
    if (!itemName) {
        document.getElementById('foundItemName').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('foundItemName').closest('.form-group').classList.remove('error');
    }
    
    return isValid;
}

function validateFoundDetails() {
    const description = document.getElementById('foundItemDescription').value.trim();
    const color = document.getElementById('foundItemColor').value.trim();
    
    let isValid = true;
    
    if (!description) {
        document.getElementById('foundItemDescription').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('foundItemDescription').closest('.form-group').classList.remove('error');
    }
    
    if (!color) {
        document.getElementById('foundItemColor').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('foundItemColor').closest('.form-group').classList.remove('error');
    }
    
    return isValid;
}

function validateFoundLocationContact() {
    const location = document.getElementById('foundLocation').value.trim();
    const date = document.getElementById('foundDate').value;
    const contactName = document.getElementById('foundContactName').value.trim();
    const contactEmail = document.getElementById('foundContactEmail').value.trim();
    
    let isValid = true;
    
    if (!location) {
        document.getElementById('foundLocation').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('foundLocation').closest('.form-group').classList.remove('error');
    }
    
    if (!date) {
        document.getElementById('foundDate').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('foundDate').closest('.form-group').classList.remove('error');
    }
    
    if (!contactName) {
        document.getElementById('foundContactName').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('foundContactName').closest('.form-group').classList.remove('error');
    }
    
    if (!contactEmail || !appUtils.validateEmail(contactEmail)) {
        document.getElementById('foundContactEmail').closest('.form-group').classList.add('error');
        isValid = false;
    } else {
        document.getElementById('foundContactEmail').closest('.form-group').classList.remove('error');
    }
    
    return isValid;
}

function setupFoundCategorySelection() {
    const categoryOptions = document.querySelectorAll('.category-option');
    
    categoryOptions.forEach(option => {
        option.addEventListener('click', function() {
            categoryOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            this.closest('.form-section').dataset.selectedCategory = this.dataset.category;
        });
    });
}

function populateFoundReviewSection() {
    const reviewContent = document.getElementById('foundReviewContent');
    if (!reviewContent) return;
    
    const category = document.querySelector('.category-option.selected')?.dataset.category || 'Not selected';
    const itemName = document.getElementById('foundItemName').value;
    const description = document.getElementById('foundItemDescription').value;
    const color = document.getElementById('foundItemColor').value;
    const brand = document.getElementById('foundItemBrand').value;
    const model = document.getElementById('foundItemModel').value;
    const location = document.getElementById('foundLocation').value;
    const date = document.getElementById('foundDate').value;
    const time = document.getElementById('foundTime').value;
    const contactName = document.getElementById('foundContactName').value;
    const contactEmail = document.getElementById('foundContactEmail').value;
    const contactPhone = document.getElementById('foundContactPhone').value;
    const additionalInfo = document.getElementById('foundAdditionalInfo').value;
    const storageLocation = document.getElementById('itemStorageLocation')?.value || '';
    
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
            <h4>Found Details</h4>
            <div class="review-grid">
                <div class="review-item"><strong>Location Found:</strong> <span>${location}</span></div>
                <div class="review-item"><strong>Date & Time:</strong> <span>${date} at ${time}</span></div>
                <div class="review-item"><strong>Current Storage:</strong> <span>${storageLocation || 'Not specified'}</span></div>
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

function setupFoundFormValidation() {
    const foundForm = document.getElementById('foundItemForm');
    
    if (foundForm) {
        foundForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitFoundItem();
        });
    }
    
    const emailInput = document.getElementById('foundContactEmail');
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

function setupStorageLocation() {
    const storageSelect = document.getElementById('itemStorageLocation');
    if (storageSelect) {
        const storageOptions = ['With me', 'Security office', 'Lost & Found office', 'Reception desk', 'Other location'];
        
        storageOptions.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            storageSelect.appendChild(optionElement);
        });
        
        storageSelect.addEventListener('change', function() {
            const otherLocationGroup = document.getElementById('otherLocationGroup');
            if (otherLocationGroup) {
                otherLocationGroup.style.display = this.value === 'Other location' ? 'block' : 'none';
            }
        });
    }
}

// 🔐 MAIN SUBMIT FUNCTION - Connects to PHP Database
function submitFoundItem() {
    if (!validateFoundStep(0) || !validateFoundStep(1) || !validateFoundStep(2)) {
        appUtils.showNotification('Please complete all form sections correctly', 'error');
        showFoundStep(0);
        return;
    }
    
    const category = document.querySelector('.category-option.selected').dataset.category;
    
    // Get image as base64 if exists
    let imageBase64 = '';
    const imagePreview = document.getElementById('foundImagePreview');
    const imgElement = imagePreview?.querySelector('img');
    if (imgElement && imgElement.src) {
        imageBase64 = imgElement.src;
    }
    
    const storageLocation = document.getElementById('itemStorageLocation').value;
    const otherLocation = document.getElementById('otherStorageLocation')?.value;
    const finalStorage = storageLocation === 'Other location' ? otherLocation : storageLocation;
    
    const formData = {
        category: category,
        item_name: document.getElementById('foundItemName').value.trim(),
        description: document.getElementById('foundItemDescription').value.trim(),
        color: document.getElementById('foundItemColor').value.trim(),
        brand: document.getElementById('foundItemBrand').value.trim(),
        model: document.getElementById('foundItemModel').value.trim(),
        location: document.getElementById('foundLocation').value.trim(),
        date: document.getElementById('foundDate').value,
        time: document.getElementById('foundTime').value,
        storage_location: finalStorage,
        contact_name: document.getElementById('foundContactName').value.trim(),
        contact_email: document.getElementById('foundContactEmail').value.trim(),
        contact_phone: document.getElementById('foundContactPhone').value.trim(),
        additional_info: document.getElementById('foundAdditionalInfo').value.trim(),
        image: imageBase64
    };
    
    const submitBtn = document.querySelector('#step4 .btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    // 🔐 SEND TO PHP DATABASE
    fetch('php/save_found.php', {
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
            console.log('Found item saved to database! ID:', data.item_id);
            showFoundConfirmation(data.verification_code);
            appUtils.showNotification('Found item reported successfully!', 'success');
            document.getElementById('foundItemForm').reset();
        } else {
            appUtils.showNotification('Error: ' + (data.error || 'Unknown error'), 'error');
        }
    })
    .catch(error => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        console.error('Fetch error:', error);
        appUtils.showNotification(
            'Could not reach server. Check: 1) XAMPP is running 2) You are on http://localhost/trackify/found.html (not file://)',
            'error'
        );
    });
}

function showFoundConfirmation(verificationCode) {
    const confirmationSection = document.getElementById('foundConfirmationSection');
    const formSections = document.querySelectorAll('.form-section');
    
    formSections.forEach(section => {
        section.style.display = 'none';
    });
    
    if (confirmationSection) {
        confirmationSection.style.display = 'block';
        document.getElementById('foundConfirmationCode').textContent = verificationCode;
        confirmationSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    if (typeof updateStats === 'function') {
        updateStats();
    }
}