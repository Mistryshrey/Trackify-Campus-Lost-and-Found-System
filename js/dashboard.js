// COMPLETE dashboard.js with Photo Hiding + Limited Info

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    setupDashboardFilters();
    setupDashboardSearch();
});

function initializeDashboard() {
    console.log('Initializing Dashboard');
    loadFromDatabase();  
    setupDashboardTabs();
    
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadDashboardItems();
            appUtils.showNotification('Dashboard refreshed', 'success');
        });
    }
    
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            clearDashboardFilters();
        });
    }
}

function setupDashboardTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabType = this.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `${tabType}Items`) {
                    pane.classList.add('active');
                }
            });
            loadTabItems(tabType);
        });
    });
    loadTabItems('lost');
}

function loadTabItems(tabType) {
    const itemsContainer = document.getElementById(`${tabType}ItemsContainer`);
    if (!itemsContainer) return;
    
    const items = JSON.parse(localStorage.getItem(`${tabType}Items`) || '[]');
    const filteredItems = applyDashboardFilters(items, tabType);
    displayDashboardItems(filteredItems, tabType, itemsContainer);
    updateItemCount(tabType, filteredItems.length, items.length);
}

function loadDashboardItems() {
    loadTabItems('lost');
    loadTabItems('found');
    loadTabItems('matched');
}

// ✅ MAIN FUNCTION - This handles hiding photos for found items
function displayDashboardItems(items, type, container) {
    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <h3>No ${type} items found</h3>
                <p>${getEmptyStateMessage(type)}</p>
                ${type !== 'matched' ? `<a href="${type}.html" class="btn btn-primary">Report ${type} Item</a>` : ''}
            </div>
        `;
        return;
    }
    
    let itemsHTML = '';
    
    items.forEach(item => {
        const itemDate = type === 'matched' ? item.matchDate : item.dateReported;
        const statusBadge = getStatusBadge(item.status, type);
        
        itemsHTML += `
            <div class="card dashboard-item" data-id="${item.id}" data-type="${type}">
                <div class="card-header">
                    <div class="item-category">
                        ${appUtils.getCategoryIcon(item.category)} ${item.category}
                    </div>
                    ${statusBadge}
                </div>
                
                <div class="card-body">
                    ${type === 'found' ? `
                        <!-- 🔒 FOUND ITEMS: NO PHOTO VISIBLE -->
                        <div class="item-image" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; min-height: 100px; border-radius: 8px;">
                            <div style="text-align: center;">
                                <div style="font-size: 2rem;">🔒</div>
                                <p style="font-size: 0.7rem; margin-top: 5px;">Photo hidden<br>for security</p>
                            </div>
                        </div>
                    ` : `
                        <!-- LOST ITEMS: Show photo (only owner sees) -->
                        <div class="item-image">
                            <img src="${item.image || 'images/default-item.jpg'}" alt="${item.itemName}" onerror="this.src='images/default-item.jpg'" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px;">
                        </div>
                    `}
                    
                    <div class="item-details">
                        <h3 class="item-title">${escapeHtml(item.itemName)}</h3>
                        
                        ${type === 'found' ? `
                            <p class="item-description"><em>🔒 Details hidden. Claim to verify ownership.</em></p>
                            <div class="item-meta">
                                <div class="meta-item"><strong>📍 Area:</strong> <span>${getGeneralArea(item.location)}</span></div>
                                <div class="meta-item"><strong>📅 Found:</strong> <span>${formatDateShort(item.date)}</span></div>
                            </div>
                        ` : `
                            <p class="item-description">${escapeHtml(item.description || 'No description')}</p>
                            <div class="item-meta">
                                <div class="meta-item"><strong>📍 Location:</strong> <span>${escapeHtml(item.location)}</span></div>
                                <div class="meta-item"><strong>📅 Date:</strong> <span>${formatDateShort(item.date)}</span></div>
                                ${item.color ? `<div class="meta-item"><strong>🎨 Color:</strong> <span>${escapeHtml(item.color)}</span></div>` : ''}
                            </div>
                        `}
                        
                        ${type === 'matched' ? `<div class="meta-item"><strong>🔗 Match:</strong> <span>${item.matchScore || 'N/A'}%</span></div>` : ''}
                    </div>
                </div>
                
                <div class="card-footer">
                    <div class="item-actions">
                        <button class="btn btn-secondary btn-sm" onclick="viewItemDetails('${item.id}', '${type}')">View Details</button>
                        ${type === 'matched' ? `<button class="btn btn-primary btn-sm" onclick="initiateClaim('${item.id}')">Claim Item</button>` : ''}
                        <button class="btn btn-outline btn-sm" onclick="editItem('${item.id}', '${type}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="deleteItem('${item.id}', '${type}')">Delete</button>
                    </div>
                    ${type !== 'matched' ? `<div class="verification-code"><small>Code: <strong>${item.verificationCode}</strong></small></div>` : ''}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = itemsHTML;
}

// Helper functions
function getGeneralArea(location) {
    const areas = ['Library', 'Canteen', 'Gym', 'Lab', 'Classroom', 'Bus', 'Hostel', 'Office', 'Ground'];
    for (const area of areas) {
        if (location.toLowerCase().includes(area.toLowerCase())) return area;
    }
    return 'Campus';
}

function formatDateShort(dateStr) {
    if (!dateStr) return 'Unknown';
    const d = new Date(dateStr);
    return `${d.getMonth()+1}/${d.getDate()}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function getEmptyStateMessage(type) {
    const messages = {
        lost: "You haven't reported any lost items yet.",
        found: "You haven't reported any found items yet.",
        matched: "No matches found yet."
    };
    return messages[type] || "No items found.";
}

function getStatusBadge(status, type) {
    const classes = {
        active: 'status-active',
        pending: 'status-pending',
        matched: 'status-matched',
        claimed: 'status-claimed',
        under_review: 'status-warning'
    };
    return `<span class="status-badge ${classes[status] || 'status-active'}">${status || 'Active'}</span>`;
}

function applyDashboardFilters(items, type) {
    let filtered = [...items];
    const category = document.getElementById('categoryFilter')?.value;
    const status = document.getElementById('statusFilter')?.value;
    if (category) filtered = filtered.filter(i => i.category === category);
    if (status) filtered = filtered.filter(i => i.status === status);
    return filtered;
}

function clearDashboardFilters() {
    const inputs = ['categoryFilter', 'statusFilter', 'dateFromFilter', 'dateToFilter'];
    inputs.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    loadDashboardItems();
    appUtils.showNotification('Filters cleared', 'success');
}

function setupDashboardFilters() {
    ['categoryFilter', 'statusFilter', 'dateFromFilter', 'dateToFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', () => loadDashboardItems());
    });
}

function setupDashboardSearch() {
    const search = document.getElementById('dashboardSearch');
    if (search) {
        search.addEventListener('input', function() {
            const term = this.value.toLowerCase();
            ['lost', 'found', 'matched'].forEach(type => {
                const items = JSON.parse(localStorage.getItem(`${type}Items`) || '[]');
                const filtered = items.filter(i => 
                    i.itemName?.toLowerCase().includes(term) || 
                    i.description?.toLowerCase().includes(term) ||
                    i.location?.toLowerCase().includes(term)
                );
                const container = document.getElementById(`${type}ItemsContainer`);
                if (container) displayDashboardItems(filtered, type, container);
            });
        });
    }
}

function updateItemCount(type, filtered, total) {
    const el = document.querySelector(`[data-tab="${type}"] .item-count`);
    if (el) el.textContent = `(${filtered}${filtered !== total ? `/${total}` : ''})`;
}

function viewItemDetails(id, type) {
    const items = JSON.parse(localStorage.getItem(`${type}Items`) || '[]');
    const item = items.find(i => i.id === id);
    if (!item) return appUtils.showNotification('Item not found', 'error');
    
    const modalContent = `
        <div class="modal-header"><h2>Item Details</h2><button class="modal-close" onclick="appUtils.closeModal('itemDetailsModal')">&times;</button></div>
        <div><strong>Name:</strong> ${escapeHtml(item.itemName)}</div>
        <div><strong>Category:</strong> ${item.category}</div>
        <div><strong>Description:</strong> ${escapeHtml(item.description || 'N/A')}</div>
        <div><strong>Location:</strong> ${escapeHtml(item.location)}</div>
        <div><strong>Date:</strong> ${item.date}</div>
        <div><strong>Verification Code:</strong> <code>${item.verificationCode}</code></div>
    `;
    showCustomModal('itemDetailsModal', modalContent);
}

function editItem(id, type) { appUtils.showNotification('Edit coming soon', 'info'); }

function deleteItem(id, type) {
    if (!confirm('Delete this item?')) return;
    const items = JSON.parse(localStorage.getItem(`${type}Items`) || '[]');
    const updated = items.filter(i => i.id !== id);
    localStorage.setItem(`${type}Items`, JSON.stringify(updated));
    loadDashboardItems();
    appUtils.showNotification('Item deleted', 'success');
}

function initiateClaim(matchId) { window.location.href = `verify.html?match=${matchId}`; }

function showCustomModal(modalId, content) {
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content">${content}</div>`;
        document.body.appendChild(modal);
    } else {
        modal.querySelector('.modal-content').innerHTML = content;
    }
    appUtils.openModal(modalId);
}

// Add warning status style
const style = document.createElement('style');
style.textContent = `.status-warning { background: #fff3cd; color: #856404; }`;
document.head.appendChild(style);
// 🔐 ADD THIS FUNCTION AT THE VERY END OF dashboard.js
function loadFromDatabase() {
    const email = localStorage.getItem('userEmail') || 'test@example.com';
    
    fetch(`php/get_matches.php?email=${encodeURIComponent(email)}`)
        .then(response => response.json())
        .then(data => {
            if (data.lost_items) {
                localStorage.setItem('lostItems', JSON.stringify(data.lost_items));
            }
            if (data.found_items) {
                localStorage.setItem('foundItems', JSON.stringify(data.found_items));
            }
            if (data.matches) {
                localStorage.setItem('matches', JSON.stringify(data.matches));
            }
            loadDashboardItems();
        })
        .catch(error => console.error('Error loading from database:', error));
}