import axios from 'axios';
import { API_URL } from '../utils/constants';

export const fetchAdminData = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/dashboard`);
    return response.data.data;
  } catch (error) {
    console.error("Admin fetch error: ", error);
    throw error;
  }
};

// Add a new function to fetch hours data for a specific listing
export const fetchListingHours = async (listingId) => {
  try {
    const response = await axios.get(`${API_URL}/listings/${listingId}/hours`);
    return response.data.data;
  } catch (error) {
    console.error("Hours fetch error: ", error);
    throw error;
  }
};