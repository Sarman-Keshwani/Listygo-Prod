// utils/listingEvents.js

export const dispatchListingAddedEvent = (listing) => {
  const event = new CustomEvent('listingAdded', { detail: listing });
  window.dispatchEvent(event);
};

export const dispatchListingDeletedEvent = (listingId) => {
  const event = new CustomEvent('listingDeleted', { detail: listingId });
  window.dispatchEvent(event);
};