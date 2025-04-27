import React, { useEffect, useState } from "react";
import axios from "axios";
import { notification, Skeleton } from "antd";
import { motion } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ResponsiveFullStretchLayout() {
  const [boxData, setBoxData] = useState({
    large1: "",
    large2: "",
    small1: "",
    small2: "",
    small3: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchGridContent = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/layout`);

      if (response.data.success) {
        setBoxData(response.data.data);
      } else {
        setBoxData({
          large1: "",
          large2: "",
          small1: "",
          small2: "",
          small3: "",
        });
      }
    } catch (error) {
      console.error("Error fetching grid content:", error);
      notification.error({
        message: "Error",
        description: "Failed to load grid content",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGridContent();
  }, []);

  const renderContent = (content, isLarge) => {
    if (loading) {
      return <Skeleton.Image active className="w-full h-full" />;
    }
    
    if (!content) {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 text-gray-400">
          <span className="text-center px-4">{isLarge ? 'Featured Content' : 'Highlight'}</span>
        </div>
      );
    }

    return content.startsWith("http") ? (
      <div className="relative group w-full h-full overflow-hidden">
        <motion.img 
          src={content} 
          alt="Featured content" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    ) : (
      <motion.div 
        className="flex items-center justify-center w-full h-full text-2xl font-bold bg-gradient-to-br from-blue-50 to-white p-6 text-blue-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {content}
      </motion.div>
    );
  };

  // Container animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  // Item animation variants
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      className="flex flex-col min-h-screen w-full p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="mb-8">
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-blue-800 mb-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Featured Content
        </motion.h1>
        <motion.div 
          className="w-20 h-1 bg-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        ></motion.div>
      </div>

      {/* Top Row - Featured Content */}
      <motion.div className="flex flex-col md:flex-row w-full mb-8 gap-4 md:gap-8" variants={containerVariants}>
        <motion.div 
          className="bg-white flex-1 h-[300px] md:h-[400px] rounded-2xl shadow-xl overflow-hidden border border-gray-100"
          variants={itemVariants}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          {renderContent(boxData.large1, true)}
        </motion.div>
        <motion.div 
          className="bg-white flex-1 h-[300px] md:h-[400px] rounded-2xl shadow-xl overflow-hidden border border-gray-100"
          variants={itemVariants}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          {renderContent(boxData.large2, true)}
        </motion.div>
      </motion.div>

      {/* Bottom Section Title */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <h2 className="text-2xl md:text-3xl font-semibold text-blue-700">Highlights</h2>
        <div className="w-16 h-1 bg-blue-400 rounded-full mt-2"></div>
      </motion.div>

      {/* Bottom Row - Highlights */}
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full gap-4 md:gap-8" variants={containerVariants}>
        <motion.div 
          className="bg-white h-[250px] rounded-xl shadow-lg overflow-hidden border border-gray-100"
          variants={itemVariants}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          {renderContent(boxData.small1)}
        </motion.div>
        <motion.div 
          className="bg-white h-[250px] rounded-xl shadow-lg overflow-hidden border border-gray-100"
          variants={itemVariants}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          {renderContent(boxData.small2)}
        </motion.div>
        <motion.div 
          className="bg-white h-[250px] rounded-xl shadow-lg overflow-hidden border border-gray-100"
          variants={itemVariants}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          {renderContent(boxData.small3)}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
