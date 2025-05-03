import React, { useState } from "react";
import { Form, Input, Upload, Button, Card, Tabs, message, Image, Spin } from "antd";
import { FiUpload, FiSave, FiTrash2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const { TabPane } = Tabs;
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const LayoutEditor = ({ boxData, onUpdate }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState({});
  const [uploadingImage, setUploadingImage] = useState({});

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Update layout content via API - Corrected endpoint
      await axios.post(`${API_URL}/layout`, values, {
        withCredentials: true
      });

      message.success("Layout content updated successfully");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating layout:", error);
      message.error("Failed to update layout content");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, boxKey) => {
    try {
      setUploadingImage(prev => ({ ...prev, [boxKey]: true }));
      
      // Create preview for immediate feedback
      const reader = new FileReader();
      reader.onload = () => {
        setPreviews(prev => ({ ...prev, [boxKey]: reader.result }));
      };
      reader.readAsDataURL(file);

      // Create form data for file upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("boxKey", boxKey);

      // Corrected API endpoint URL
      const response = await axios.post(
        `${API_URL}/api/layout/upload-image`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true
        }
      );

      // Get the image URL from response
      const imageUrl = response.data.url;

      // Update the form field with the new URL
      form.setFieldsValue({
        [boxKey]: imageUrl,
      });

      // Update preview with actual URL
      setPreviews(prev => ({ ...prev, [boxKey]: imageUrl }));
      
      message.success("Image uploaded successfully");
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error uploading image:", error);
      message.error("Failed to upload image");
    } finally {
      setUploadingImage(prev => ({ ...prev, [boxKey]: false }));
    }
  };

  const removeImage = (boxKey) => {
    form.setFieldsValue({ [boxKey]: "" });
    setPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[boxKey];
      return newPreviews;
    });
  };

  // Initialize previews from boxData if they contain image URLs
  React.useEffect(() => {
    if (boxData) {
      const initialPreviews = {};
      Object.keys(boxData).forEach(key => {
        const value = boxData[key];
        if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
          initialPreviews[key] = value;
        }
      });
      setPreviews(initialPreviews);
    }
  }, [boxData]);

  const renderBoxContent = (boxKey) => {
    return (
      <div className="space-y-4 transition-all duration-300 hover:shadow-md p-5 rounded-lg bg-white/50 backdrop-blur-sm">
        <Form.Item
          label={
            <span className="text-gray-700 font-medium">
              {`${boxKey.includes('large') ? 'Large' : 'Small'} Box ${boxKey.slice(-1)}`}
            </span>
          }
          name={boxKey}
          tooltip="Enter text or image URL"
        >
          <Input.TextArea
            rows={boxKey.includes('large') ? 4 : 3}
            placeholder="Enter content or image URL"
            className="transition-all duration-300 focus:border-blue-500 hover:border-blue-300 rounded-md"
          />
        </Form.Item>
        
        <AnimatePresence mode="wait">
          {previews[boxKey] ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 15 }}
              className="preview-container"
            >
              <div className="relative group">
                <Image 
                  src={previews[boxKey]} 
                  alt={`Preview for ${boxKey}`}
                  className="rounded-lg shadow-md max-h-48 object-cover w-full border-2 border-blue-100"
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/10 rounded-lg flex items-center justify-center"
                >
                  <Button 
                    icon={<FiTrash2 className="text-red-500" />} 
                    danger
                    onClick={() => removeImage(boxKey)}
                    className="bg-white/90 hover:bg-white border-red-300 hover:border-red-500 shadow-lg"
                    size="middle"
                  />
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-3"
            >
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleImageUpload(file, boxKey);
                  return false;
                }}
              >
                <Button 
                  icon={<FiUpload className={uploadingImage[boxKey] ? 'text-gray-400' : 'text-blue-500'} />} 
                  className={`transition-all duration-300 border-dashed ${
                    uploadingImage[boxKey] 
                      ? 'bg-gray-50 border-gray-300' 
                      : 'hover:bg-blue-50 hover:border-blue-400 border-blue-200'
                  } rounded-md w-full py-2 h-auto flex items-center justify-center`}
                  disabled={uploadingImage[boxKey]}
                >
                  {uploadingImage[boxKey] ? (
                    <span className="flex items-center">
                      <Spin size="small" className="mr-2" /> Uploading...
                    </span>
                  ) : (
                    <span className="text-gray-600">Drop image or click to upload</span>
                  )}
                </Button>
              </Upload>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="bg-gradient-to-br from-blue-50 to-white p-1 rounded-xl"
    >
      <Card 
        title={
          <div className="text-lg font-semibold text-blue-800 flex items-center">
            <motion.span 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Edit Layout Content
            </motion.span>
          </div>
        }
        className="mb-6 shadow-lg hover:shadow-xl transition-all duration-500 rounded-xl border-none overflow-hidden"
        headStyle={{ 
          background: 'linear-gradient(to right, #f0f5ff, #e6f7ff)', 
          borderBottom: '1px solid #d6e4ff',
          padding: '16px 24px',
          borderRadius: '0.75rem 0.75rem 0 0'
        }}
        bodyStyle={{ padding: '28px' }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={boxData}
          onFinish={handleSubmit}
          className="animate-form"
        >
          <Tabs 
            defaultActiveKey="large"
            type="card"
            className="layout-tabs"
            animated={{ tabPane: true }}
          >
            <TabPane tab={
              <span className="px-2 py-1 flex items-center font-medium">Large Boxes</span>
            } key="large">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4"
              >
                {["large1", "large2"].map((key, index) => (
                  <motion.div 
                    key={key} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.01, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.1)" }}
                    className="bg-gradient-to-br from-white to-blue-50 rounded-xl border border-blue-100 overflow-hidden shadow-sm"
                  >
                    {renderBoxContent(key)}
                  </motion.div>
                ))}
              </motion.div>
            </TabPane>

            <TabPane tab={
              <span className="px-2 py-1 flex items-center font-medium">Small Boxes</span>
            } key="small">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4"
              >
                {["small1", "small2", "small3"].map((key, index) => (
                  <motion.div 
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.1)" }}
                    className="bg-gradient-to-br from-white to-blue-50 rounded-xl border border-blue-100 overflow-hidden shadow-sm"
                  >
                    {renderBoxContent(key)}
                  </motion.div>
                ))}
              </motion.div>
            </TabPane>
          </Tabs>

          <motion.div 
            className="flex justify-end mt-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                type="primary"
                icon={<FiSave className="mr-1" />}
                loading={loading}
                htmlType="submit"
                className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 
                           transition-all duration-300 transform shadow-lg hover:shadow-blue-200/50 
                           border-none text-base px-6 h-10 flex items-center"
                size="large"
              >
                Save Changes
              </Button>
            </motion.div>
          </motion.div>
        </Form>
      </Card>
    </motion.div>
  );
};
