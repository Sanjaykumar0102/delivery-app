// Add these sections BEFORE the closing </main> tag in AdminDashboard.jsx (around line 888)

{/* Customers Tab */}
{activeTab === "customers" && (
  <div className="customers-section">
    <div className="section-header">
      <h2>👥 All Customers</h2>
      <p>Total: {customers.length} customers</p>
    </div>

    <div className="users-grid">
      {customers.map((customer) => (
        <div key={customer._id} className={`user-card ${!customer.isActive ? 'deactivated' : ''}`}>
          <div className="user-avatar-large">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-info-full">
            <h3>{customer.name}</h3>
            <p className="user-email">📧 {customer.email}</p>
            <p className="user-phone">📱 {customer.phone || "N/A"}</p>
            
            <div className="user-meta">
              <p>📅 Joined: {new Date(customer.createdAt).toLocaleDateString()}</p>
              {!customer.isActive && customer.deactivationReason && (
                <p className="deactivation-reason">🚫 {customer.deactivationReason}</p>
              )}
            </div>

            <div className="user-actions">
              <button 
                className={customer.isActive ? "deactivate-btn" : "activate-btn"}
                onClick={() => openDeactivateModal(customer)}
              >
                {customer.isActive ? '🚫 Block Customer' : '✅ Unblock Customer'}
              </button>
            </div>
          </div>
          {!customer.isActive && (
            <div className="deactivated-badge">🚫 Blocked</div>
          )}
        </div>
      ))}
    </div>
  </div>
)}

{/* Admins Tab */}
{activeTab === "admins" && (
  <div className="admins-section">
    <div className="section-header">
      <h2>🛡️ All Admins</h2>
      <p>Total: {admins.length} admins</p>
    </div>

    <div className="users-grid">
      {admins.map((admin) => (
        <div key={admin._id} className={`user-card admin-card ${!admin.isActive ? 'deactivated' : ''}`}>
          <div className="user-avatar-large admin-avatar">
            {admin.name.charAt(0).toUpperCase()}
          </div>
          <div className="user-info-full">
            <h3>{admin.name} 🛡️</h3>
            <p className="user-email">📧 {admin.email}</p>
            <p className="user-phone">📱 {admin.phone || "N/A"}</p>
            
            <div className="user-meta">
              <p>📅 Joined: {new Date(admin.createdAt).toLocaleDateString()}</p>
              {!admin.isActive && admin.deactivationReason && (
                <p className="deactivation-reason">🚫 {admin.deactivationReason}</p>
              )}
            </div>

            {admin._id !== user?._id && (
              <div className="user-actions">
                <button 
                  className={admin.isActive ? "deactivate-btn" : "activate-btn"}
                  onClick={() => openDeactivateModal(admin)}
                >
                  {admin.isActive ? '🚫 Deactivate' : '✅ Activate'}
                </button>
              </div>
            )}
          </div>
          {!admin.isActive && (
            <div className="deactivated-badge">🚫 Deactivated</div>
          )}
        </div>
      ))}
    </div>
  </div>
)}

// Add this modal BEFORE the closing </div> of the admin-dashboard (at the end of the file)

{/* Deactivate/Activate User Modal */}
{showDeactivateModal && selectedUser && (
  <div className="modal-overlay" onClick={() => setShowDeactivateModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>{selectedUser.isActive ? '🚫 Deactivate User' : '✅ Activate User'}</h2>
        <button className="close-btn" onClick={() => setShowDeactivateModal(false)}>
          ✕
        </button>
      </div>

      <div className="modal-body">
        <div className="user-summary">
          <p><strong>Name:</strong> {selectedUser.name}</p>
          <p><strong>Email:</strong> {selectedUser.email}</p>
          <p><strong>Role:</strong> {selectedUser.role}</p>
          <p><strong>Current Status:</strong> {selectedUser.isActive ? '✅ Active' : '🚫 Deactivated'}</p>
        </div>

        {selectedUser.isActive && (
          <div className="form-group">
            <label>Reason for Deactivation *</label>
            <textarea
              className="reason-textarea"
              placeholder="Enter reason for deactivation..."
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
              rows="4"
            />
          </div>
        )}

        {!selectedUser.isActive && selectedUser.deactivationReason && (
          <div className="info-box">
            <p><strong>Previous Deactivation Reason:</strong></p>
            <p>{selectedUser.deactivationReason}</p>
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button className="cancel-btn" onClick={() => setShowDeactivateModal(false)}>
          Cancel
        </button>
        <button 
          className={selectedUser.isActive ? "deactivate-btn" : "activate-btn"}
          onClick={handleToggleUserActive}
        >
          {selectedUser.isActive ? '🚫 Deactivate' : '✅ Activate'}
        </button>
      </div>
    </div>
  </div>
)}
