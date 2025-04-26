import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Table, Button, Form, Input, 
  Popconfirm, Space, Card, Tag,
  Switch, notification, Modal,
  Typography, Spin, Empty
} from 'antd';
import { 
  FiPlus, FiEdit, FiTrash2, FiCheck, 
  FiX, FiList, FiGrid, FiTag
} from 'react-icons/fi';

const { Title, Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const AdminCategories = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || !isAuthenticated || (userRole !== 'admin' && userRole !== 'super-admin')) {
      navigate('/admin/login');
    } else {
      fetchCategories();
    }
  }, [navigate]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to load categories. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (values) => {
    try {
      const token = localStorage.getItem('token');
      
      // Ensure all required fields are present and properly formatted
      const categoryData = {
        name: values.name.trim(), // Trim whitespace
        // Only include other fields if they have values
        ...(values.description ? { description: values.description.trim() } : {}),
        ...(values.icon ? { icon: values.icon.trim() } : {}),
        active: values.active !== undefined ? values.active : true
      };
      
      console.log('Attempting to create category with data:', categoryData);
      
      const response = await axios.post(
        `${API_URL}/categories`,
        categoryData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('API response:', response.data);
      
      notification.success({
        message: 'Success',
        description: 'Category created successfully!',
      });
      
      setModalVisible(false);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      console.error('Error creating category:', error);
      
      // Log the detailed error response for debugging
      if (error.response) {
        console.log('Error response data:', error.response.data);
        console.log('Error response status:', error.response.status);
        
        if (error.response.status === 400) {
          // More specific error handling for 400 errors
          if (error.response.data && error.response.data.message) {
            notification.error({
              message: 'Validation Error',
              description: error.response.data.message,
            });
          } else if (error.response.data && error.response.data.errors) {
            // Format validation errors if they exist in the response
            const errorMessages = Object.entries(error.response.data.errors)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join('; ');
            
            notification.error({
              message: 'Validation Error',
              description: errorMessages || 'Invalid data provided',
            });
          } else {
            notification.error({
              message: 'Error',
              description: 'The category could not be created. Please check your data.',
            });
          }
        } else {
          notification.error({
            message: 'Error',
            description: error.response.data?.message || `Server error (${error.response.status})`,
          });
        }
      } else {
        notification.error({
          message: 'Error',
          description: error.message || 'Failed to create category. Network or server issue.',
        });
      }
    }
  };

  // Also improve the handleUpdateCategory function with similar error handling
  const handleUpdateCategory = async (values) => {
    try {
      const token = localStorage.getItem('token');
      
      // Prepare category data similar to create function
      const categoryData = {
        name: values.name.trim(),
        ...(values.description ? { description: values.description.trim() } : {}),
        ...(values.icon ? { icon: values.icon.trim() } : {}),
        active: values.active !== undefined ? values.active : true
      };
      
      console.log('Updating category with data:', categoryData);
      
      const response = await axios.put(
        `${API_URL}/categories/${editingCategory._id}`,
        categoryData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Update response:', response.data);
      
      notification.success({
        message: 'Success',
        description: 'Category updated successfully!',
      });
      
      setModalVisible(false);
      setEditingCategory(null);
      form.resetFields();
      fetchCategories();
    } catch (error) {
      // Use similar error handling as in the create function
      console.error('Error updating category:', error);
      
      if (error.response) {
        console.log('Error response data:', error.response.data);
        
        notification.error({
          message: 'Error',
          description: error.response.data?.message || `Failed to update category (${error.response.status})`,
        });
      } else {
        notification.error({
          message: 'Error',
          description: error.message || 'Failed to update category. Please try again.',
        });
      }
    }
  };

  const handleDelete = async (categoryId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Find the category we want to delete
      const categoryToUpdate = categories.find(cat => cat._id === categoryId);
      
      if (!categoryToUpdate) {
        notification.error({
          message: 'Error',
          description: 'Category not found',
        });
        setLoading(false);
        return;
      }
      
      console.log(`Backend has issues with deleting. Attempting to mark category '${categoryToUpdate.name}' as inactive instead.`);
      
      // WORKAROUND: Instead of deleting (which doesn't work on backend), mark as inactive
      const response = await axios.put(
        `${API_URL}/categories/${categoryId}`,
        { ...categoryToUpdate, active: false },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Update response:', response.data);
      
      notification.success({
        message: 'Category Deactivated',
        description: 'The category has been marked as inactive since deletion is not supported by the backend.',
        duration: 6,
      });
      
      // Refresh the categories list
      fetchCategories();
    } catch (error) {
      console.error('Error handling category deletion/deactivation:', error);
      console.log('Error response:', error.response?.data);
      
      notification.error({
        message: 'Action Failed',
        description: 'Could not complete the operation. Please try again or contact the administrator.',
        duration: 6,
      });
    } finally {
      setLoading(false);
    }
  };

  // Add this new function to handle toggling the active status
  const handleToggleActive = async (category) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/categories/${category._id}`,
        { ...category, active: !category.active },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      notification.success({
        message: 'Success',
        description: `Category ${!category.active ? 'activated' : 'deactivated'} successfully!`,
      });
      
      fetchCategories();
    } catch (error) {
      console.error('Error updating category status:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || 'Failed to update category status. Please try again.',
      });
    }
  };

  // Add the missing showCreateModal function
  const showCreateModal = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const showEditModal = (category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      icon: category.icon,
      active: category.active
    });
    setModalVisible(true);
  };

  // Modify the columns definition to use the new toggle function
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="font-medium text-blue-600">{text}</span>,
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (text) => <span className="font-medium text-blue-600">{text}</span>,
      responsive: ['md'],
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      responsive: ['md'],
      render: (text) => (
        <span className="line-clamp-2">{text || 'No description'}</span>
      ),
    },
    {
      // title: 'Status',
      // dataIndex: 'active',
      // key: 'active',
      // render: (active, record) => (
      //   <Switch 
      //     checked={active} 
      //     onChange={() => handleToggleActive(record)}
      //     checkedChildren={<FiCheck />}
      //     unCheckedChildren={<FiX />}
      //   />
      // ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary" 
            size="small" 
            icon={<FiEdit />} 
            onClick={() => showEditModal(record)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Edit
          </Button>
          <Popconfirm
            title={record.active ? "Deactivate this category?" : "This category is already inactive"}
            description={
              <div>
                <p>Due to technical limitations, categories cannot be fully deleted.</p>
                <p>This action will mark the category as inactive instead.</p>
                {record.active ? null : (
                  <p className="text-red-500 font-medium mt-2">This category is already inactive!</p>
                )}
              </div>
            }
            onConfirm={() => record.active ? handleDelete(record._id) : null}
            okText={record.active ? "Deactivate" : "Close"}
            cancelText="Cancel"
            okButtonProps={{ danger: record.active }}
            cancelButtonProps={{ style: { display: record.active ? 'inline' : 'none' } }}
          >
            <Button 
              type="primary" 
              danger
              size="small" 
              icon={<FiTrash2 />}
              disabled={!record.active}
            >
              {record.active ? "Deactivate" : "Inactive"}
            </Button>
          </Popconfirm>
          <Button 
            size="small" 
            onClick={() => navigate(`/admin/listings?category=${record._id}`)}
          >
            View Listings
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-blue-800 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">ListyGo Admin</h1>
          <div className="flex items-center gap-4">
            <span>{localStorage.getItem('userName') || 'Admin'}</span>
            <button
              className="px-3 py-1 bg-blue-700 hover:bg-blue-900 rounded"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('userRole');
                navigate('/admin/login');
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Manage Categories</h2>
            <p className="text-gray-600">Create, update and delete categories for listings</p>
          </div>
          <div className="flex gap-2">
            <Button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded flex items-center gap-1 hover:bg-gray-300"
              onClick={() => navigate('/admin/dashboard')}
            >
              Dashboard
            </Button>
            <Button
              type="primary"
              icon={<FiPlus />}
              onClick={showCreateModal}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Add Category
            </Button>
          </div>
        </div>
        <Card className="shadow-md">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
            </div>
          ) : categories.length > 0 ? (
            <Table
              dataSource={categories}
              columns={columns}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
              }}
            />
          ) : (
            <Empty
              description="No categories found"
              className="py-16"
            />
          )}
        </Card>
      </div>
      <Modal
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCategory(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingCategory ? handleUpdateCategory : handleCreateCategory}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter a category name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="icon"
            label="Icon Name"
            tooltip="Enter an icon name (e.g., 'hotel', 'gym', 'restaurant')"
          >
            <Input placeholder="e.g., hotel" />
          </Form.Item>
          <Form.Item
            name="active"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          
          <Form.Item className="flex justify-end">
            <Space>
              <Button 
                onClick={() => {
                  setModalVisible(false);
                  setEditingCategory(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCategories;


