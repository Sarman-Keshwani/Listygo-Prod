import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "https://api.pathsuchi.com/api";

// Get auth header with token
export const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper to handle API errors
const handleApiError = (error) => {
  console.error("API Error:", error);

  const message =
    error.response?.data?.message ||
    error.message ||
    "An unknown error occurred";

  throw new Error(message);
};

// Listings API calls
export const fetchListingsAPI = async (pageNum = 1, categoryId = null) => {
  try {
    let url = `${API_URL}/listings?page=${pageNum}&limit=10`;

    if (categoryId) {
      url = `${API_URL}/listings/category/${categoryId}?page=${pageNum}&limit=10`;
    }

    const response = await axios.get(url, {
      headers: getAuthHeader(),
    });

    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const fetchCategoriesAPI = async () => {
  const response = await axios.get(`${API_URL}/categories`, {
    headers: getAuthHeader(),
  });
  return response.data;
};

export const createListingAPI = async (formData) => {
  const response = await axios({
    method: "post",
    url: `${API_URL}/listings`,
    data: formData,
    headers: {
      ...getAuthHeader(),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const updateListingAPI = async (id, formData) => {
  const response = await axios({
    method: "put",
    url: `${API_URL}/listings/${id}`,
    data: formData,
    headers: {
      ...getAuthHeader(),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const deleteListingAPI = async (id) => {
  const response = await axios.delete(`${API_URL}/listings/${id}`, {
    headers: getAuthHeader(),
  });

  return response.data;
};

export const deleteImageAPI = async (listingId, imageUrl) => {
  try {
    console.log(`Deleting Firebase image from listing ${listingId}`);
    
    // For Firebase URLs, we need to handle them specially
    const response = await axios({
      method: 'put', // Use PUT instead of DELETE
      url: `${API_URL}/listings/${listingId}`,
      data: { 
        exactImageToRemove: imageUrl // Use a clear parameter name
      },
      headers: getAuthHeader()
    });
    
    return response.data;
  } catch (error) {
    console.error("Image deletion error:", error);
    return handleApiError(error);
  }
};