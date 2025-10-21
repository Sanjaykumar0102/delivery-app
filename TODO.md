# Driver Information Card Layout Fix

## Current Issue
- Call driver button and vehicle information are going outside the card boundaries
- `.driver-actions-section` uses CSS grid that causes overflow on smaller screens

## Tasks
- [x] Change `.driver-actions-section` from grid to flexbox layout
- [x] Adjust padding and margins to prevent overflow
- [x] Ensure proper responsive behavior across screen sizes
- [ ] Test layout on different screen sizes
- [ ] Verify call driver button and vehicle info stay within card boundaries

## Files to Edit
- `frontend/src/pages/Dashboard/Customer/CustomerDashboard.css`
