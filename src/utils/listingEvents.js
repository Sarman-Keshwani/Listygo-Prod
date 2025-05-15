/**
 * Utility to manage listing-related events for real-time updates
 */

/**
 * Dispatch an event when a new listing is added
 * @param {Object} listing - The listing data that was added
 */
export const dispatchListingAddedEvent = (listing) => {
  console.log('Dispatching listing added event');
  window.dispatchEvent(new CustomEvent('listingAdded', { 
    detail: { listing } 
  }));
};

/**
 * Dispatch an event when a listing is deleted
 * @param {string} listingId - The ID of the listing that was deleted
 */
export const dispatchListingDeletedEvent = (listingId) => {
  console.log('Dispatching listing deleted event');
  window.dispatchEvent(new CustomEvent('listingDeleted', { 
    detail: { listingId } 
  }));
};

/**
 * Dispatch an event when a listing is updated
 * @param {Object} listing - The updated listing data
 */
export const dispatchListingUpdatedEvent = (listing) => {
  console.log('Dispatching listing updated event');
  window.dispatchEvent(new CustomEvent('listingUpdated', { 
    detail: { listing } 
  }));
};
