// Complete verify.js - NO POPUPS

document.addEventListener('DOMContentLoaded', function() {
    initializeVerification();
});

function initializeVerification() {
    console.log('Initializing Verification System');
    
    const urlParams = new URLSearchParams(window.location.search);
    const matchId = urlParams.get('match');
    
    if (matchId) {
        loadMatchForVerification(matchId);
    } else {
        showVerificationForm();
    }
}

function loadMatchForVerification(matchId) {
    const email = localStorage.getItem('userEmail') || 'test@example.com';
    
    fetch(`php/get_matches.php?email=${encodeURIComponent(email)}`)
        .then(response => response.json())
        .then(data => {
            const match = data.matches?.find(m => m.match_id == matchId);
            if (match) {
                displayMatchForVerification(match);
            } else {
                showVerificationForm();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showVerificationForm();
        });
}

function displayMatchForVerification(match) {
    const container = document.getElementById('matchVerify');
    if (!container) return;
    
    container.innerHTML = `
        <div class="verification-header">
            <h2>Potential Match Found! 🎉</h2>
            <p>Match Confidence: <strong>${match.match_score}%</strong></p>
        </div>
        
        <div class="verification-form">
            <h3>Verify Your Identity</h3>
            
            <div class="form-group">
                <label for="verifyCode">Verification Code</label>
                <input type="text" id="verifyCode" class="form-control" 
                       placeholder="Enter your 8-character code" maxlength="8">
            </div>
            
            <div class="form-group">
                <label for="verifyEmail">Your Email Address</label>
                <input type="email" id="verifyEmail" class="form-control" 
                       placeholder="Enter the email you used">
            </div>
            
            <div class="form-group">
                <label for="verifySecret">🔐 Security Answer</label>
                <input type="text" id="verifySecret" class="form-control" 
                       placeholder="Enter the unique detail you provided">
                <div class="help-text">Example: enrollment number, IMEI last 4 digits, etc.</div>
            </div>
            
            <button class="btn btn-primary" onclick="submitVerification(${match.match_id})">
                Verify & Claim
            </button>
        </div>
    `;
    
    switchTab('match');
}

function submitVerification(matchId) {
    const verificationCode = document.getElementById('verifyCode')?.value.trim().toUpperCase();
    const email = document.getElementById('verifyEmail')?.value.trim();
    const secretAnswer = document.getElementById('verifySecret')?.value.trim();
    
    if (!verificationCode || !email || !secretAnswer) {
        appUtils.showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (!appUtils.validateEmail(email)) {
        appUtils.showNotification('Please enter a valid email', 'error');
        return;
    }
    
    fetch('php/verify_claim.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            match_id: matchId,
            verification_code: verificationCode,
            email: email,
            secret_answer: secretAnswer
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            appUtils.showNotification('Verification successful!', 'success');
            showFinderContact(data.finder_info);
        } else {
            appUtils.showNotification('Verification failed: ' + data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        appUtils.showNotification('Network error. Make sure XAMPP is running.', 'error');
    });
}

function showFinderContact(finderInfo) {
    const container = document.getElementById('matchVerify');
    if (!container) return;
    
    container.innerHTML = `
        <div class="success-message">
            <div class="success-icon">✅</div>
            <h3>Verification Successful!</h3>
            <p>Your identity has been verified. Contact the finder:</p>
            
            <div class="contact-card">
                <p><strong>Name:</strong> ${finderInfo.contact_name}</p>
                <p><strong>Email:</strong> ${finderInfo.contact_email}</p>
                ${finderInfo.contact_phone ? `<p><strong>Phone:</strong> ${finderInfo.contact_phone}</p>` : ''}
                ${finderInfo.storage_location ? `<p><strong>Item Location:</strong> ${finderInfo.storage_location}</p>` : ''}
            </div>
            
            <div class="safety-tips">
                <h4>Safety Tips:</h4>
                <ul>
                    <li>Meet in a public place on campus</li>
                    <li>Bring your student ID</li>
                    <li>Bring a friend if possible</li>
                </ul>
            </div>
            
            <button class="btn btn-success" onclick="markItemClaimed()">
                I Have Retrieved My Item
            </button>
        </div>
    `;
}

function markItemClaimed() {
    appUtils.showNotification('Thank you for confirming! Item marked as claimed.', 'success');
    setTimeout(() => {
        window.location.href = 'dashboard.html';
    }, 2000);
}

function showVerificationForm() {
    const container = document.getElementById('matchVerify');
    if (!container) return;
    
    container.innerHTML = `
        <div class="verification-form">
            <h3>Claim Your Lost Item</h3>
            <p>Enter your verification code to check for matches.</p>
            
            <div class="form-group">
                <label for="manualCode">Verification Code</label>
                <input type="text" id="manualCode" class="form-control" 
                       placeholder="Enter your 8-character code" maxlength="8">
            </div>
            
            <div class="form-group">
                <label for="manualEmail">Your Email Address</label>
                <input type="email" id="manualEmail" class="form-control" 
                       placeholder="Enter the email you used">
            </div>
            
            <div class="form-group">
                <label for="manualSecret">🔐 Security Answer</label>
                <input type="text" id="manualSecret" class="form-control" 
                       placeholder="Enter the unique detail you provided">
            </div>
            
            <button class="btn btn-primary" onclick="checkManualVerification()">
                Check for Matches
            </button>
        </div>
    `;
    
    switchTab('manual');
}

function checkManualVerification() {
    const code = document.getElementById('manualCode')?.value.trim().toUpperCase();
    const email = document.getElementById('manualEmail')?.value.trim();
    const secret = document.getElementById('manualSecret')?.value.trim();
    
    if (!code || !email || !secret) {
        appUtils.showNotification('Please fill in all fields', 'error');
        return;
    }
    
    fetch('php/verify_claim.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            verification_code: code,
            email: email,
            secret_answer: secret
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.match_id) {
            appUtils.showNotification('Match found!', 'success');
            loadMatchForVerification(data.match_id);
        } else {
            appUtils.showNotification('No match found. Please check your details.', 'info');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        appUtils.showNotification('Network error', 'error');
    });
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.verify-tab');
    const panes = document.querySelectorAll('.verify-pane');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    panes.forEach(pane => pane.classList.remove('active'));
    
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    const activePane = document.getElementById(`${tabName}Verify`);
    
    if (activeTab) activeTab.classList.add('active');
    if (activePane) activePane.classList.add('active');
}