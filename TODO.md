# TODO: Add Driver Order Rejection Feature

## Backend Changes
- [ ] Add `acceptedAt` timestamp to Order model
- [ ] Update `acceptOrder` controller to set `acceptedAt` when status becomes "Accepted"
- [ ] Add new `rejectAcceptedOrder` endpoint that allows rejection only within 2 minutes
- [ ] Update order routes to include rejection endpoint

## Frontend Changes
- [ ] Update OrderWorkflow component to show conditional "Reject" button for "Accepted" status
- [ ] Add rejection handler in DriverDashboard component
- [ ] Handle UI updates after rejection

## Testing
- [ ] Test rejection within 2-minute window
- [ ] Test rejection after 2-minute window (should fail)
- [ ] Verify socket notifications to other drivers
- [ ] Ensure proper UI updates after rejection
