import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://api.pathsuchi.com/api";

const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
};

export const fetchListingsAPI = async (pageNum = 1, categoryId = null) => {
  let url = `${API_URL}/listings?page=${pageNum}&limit=10`;
  
  if (categoryId) {
    url = `${API_URL}/listings/category/${categoryId}?page=${pageNum}&limit=10`;
  }
  
  const response = await axios.get(url, {
    headers: getAuthHeader()
  });
  
  return response.data;
};

export const fetchCategoriesAPI = async () => {
  const response = await axios.get(`${API_URL}/categories`, {
    headers: getAuthHeader()
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
    headers: getAuthHeader()
  });
  
  return response.data;
};

export const deleteImageAPI = async (listingId, imageUrl) => {
  const response = await axios({
    method: "delete",
    url: `${API_URL}/listings/${listingId}/images`,
    data: { imageUrl },
    headers: getAuthHeader(),
  });
  
  return response.data;
};