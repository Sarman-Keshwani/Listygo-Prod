import React, { useState } from "react";
import { Button, Form, Input, Upload, Tooltip, message, Spin } from "antd";
import {
  FiPlus,
  FiTrash2,
  FiX,
  FiAlertTriangle,
  FiImage,
} from "react-icons/fi";
import { deleteImageAPI } from "../../../utils/api";
import axios from "axios";
import { API_URL, getAuthHeader } from "../../../utils/api"; // Adjust the import based on your project structure

const ImagesTab = ({
  images,
  setImages,
  activeImagePreview,
  setActiveImagePreview,
  previewUrl,
  setPreviewUrl,
  editingListingId,
}) => {
  // Track loading states per image index
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [deduplicating, setDeduplicating] = useState(false); // Track deduplication state

  // Basic file validation
  const validateFile = (file) => {
    // Check file type
    const acceptedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        message: "Only JPG, PNG and WebP images are allowed",
      };
    }

    // File size check (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        valid: false,
        message: "Image must be smaller than 5MB",
      };
    }

    return { valid: true };
  };

  const handleFileUpload = (file) => {
    setUploadError(null);

    // Validate the file
    const validation = validateFile(file);
    if (!validation.valid) {
      setUploadError(validation.message);
      message.error(validation.message);
      return false;
    }

    message.loading("Processing image...", 0.5);

    try {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target.result;

        // Update images array, removing any empty placeholders
        setImages((prevImages) => {
          // Create a new array without empty strings
          const nonEmptyImages = prevImages.filter(
            (img) => img && typeof img === "string" && img.trim() !== ""
          );

          // Add the new image
          return [...nonEmptyImages, result];
        });

        // Update preview to show the new image
        setPreviewUrl(result);

        // Update active preview index to the new image
        setTimeout(() => {
          setActiveImagePreview(
            images.filter((img) => img && img.trim() !== "").length
          );
          message.success("Image added successfully");
        }, 100);
      };

      reader.onerror = () => {
        message.error("Failed to read file");
        setUploadError("Failed to read file");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing image upload:", error);
      message.error("Failed to process image");
      setUploadError("Failed to process image");
    }

    return false; // prevent automatic uploads
  };

  // Handle deletion
  const handleDeleteImage = async (imageUrl, index) => {
    // Prevent deletion while another is in progress
    if (deletingIndex !== null) return;

    // For server images in existing listings
    if (editingListingId && imageUrl) {
      if (window.confirm("Delete this image?")) {
        // Set loading state
        setDeletingIndex(index);

        try {
          console.log(`Deleting image at index ${index}: ${imageUrl}`);

          const result = await deleteImageAPI(editingListingId, imageUrl);

          if (result && result.success) {
            message.success("Image deleted successfully");

            // If server returned updated listing data, use it
            if (result.data && Array.isArray(result.data.images)) {
              setImages(result.data.images);

              // Reset preview if needed
              if (previewUrl === imageUrl) {
                setPreviewUrl(null);
              }

              // Update active preview index
              const newActiveIndex = Math.min(
                activeImagePreview,
                result.data.images.length - 1
              );
              setActiveImagePreview(Math.max(0, newActiveIndex));
            } else {
              // Fallback to local removal
              removeImageFromState(index);
            }
          } else {
            throw new Error(result?.message || "Failed to delete image");
          }
        } catch (error) {
          console.error("Error:", error);
          message.error("Failed to delete image. Trying local removal.");
          removeImageFromState(index);
        } finally {
          setDeletingIndex(null);
        }
      }
    } else {
      // For new uploads or temporary images, just remove locally
      removeImageFromState(index);
    }
  };

  // Update your removeImageFromState function to be cleaner
  const removeImageFromState = (index) => {
    console.log(`Removing image at index ${index} locally`);

    setImages((prevImages) => {
      const newImages = [...prevImages];
      newImages.splice(index, 1);

      // If no images left, add empty placeholder
      if (newImages.length === 0) {
        return [""];
      }

      return newImages;
    });
  };

  // Deduplicate images function
  const deduplicateImages = async () => {
    if (!editingListingId) return;

    setDeduplicating(true);
    try {
      const response = await axios({
        method: "post",
        url: `${API_URL}/listings/${editingListingId}/deduplicate-images`,
        headers: getAuthHeader(),
      });

      if (response.data.success) {
        message.success(`${response.data.message}`);

        // If images were changed, update the state
        if (response.data.data.originalCount !== response.data.data.newCount) {
          // Refresh the listing data
          const listingResponse = await axios({
            method: "get",
            url: `${API_URL}/listings/${editingListingId}`,
            headers: getAuthHeader(),
          });

          if (listingResponse.data.success) {
            setImages(listingResponse.data.data.images);
          }
        }
      }
    } catch (error) {
      console.error("Error deduplicating images:", error);
      message.error("Failed to deduplicate images");
    } finally {
      setDeduplicating(false);
    }
  };

  return (
    <Form.Item
      label="Images"
      required
      rules={[
        {
          validator: () => {
            const hasValidImages = images.some(
              (i) => i && typeof i === "string" && i.trim() !== ""
            );

            if (!hasValidImages) {
              return Promise.reject("At least one image is required");
            }

            return Promise.resolve();
          },
        },
      ]}
    >
      {uploadError && (
        <div className="mb-3 p-2 bg-red-50 text-red-700 border border-red-200 rounded">
          <FiAlertTriangle className="inline-block mr-2" />
          {uploadError}
        </div>
      )}

      <Upload
        name="image"
        accept=".jpg,.jpeg,.png,.webp"
        showUploadList={false}
        beforeUpload={handleFileUpload}
        maxCount={10}
      >
        <Button
          icon={<FiPlus />}
          type="primary"
          disabled={deletingIndex !== null}
        >
          Upload Image
        </Button>
      </Upload>

      <div className="text-xs text-gray-500 mt-1 mb-4">
        JPG, PNG or WebP. Max 5MB. Recommended ratio 4:3.
      </div>

      {/* Image URL inputs */}
      {images.map((url, i) => (
        <div key={`image-input-${i}`} className="relative mt-2">
          <Input
            className="pr-12"
            value={url}
            placeholder={`Image URL #${i + 1}`}
            onChange={(e) => {
              const next = [...images];
              next[i] = e.target.value;
              setImages(next);
            }}
            disabled={deletingIndex === i}
          />
          <Tooltip title="Delete image">
            <Button
              type="text"
              danger
              icon={deletingIndex === i ? <Spin size="small" /> : <FiTrash2 />}
              className="absolute right-1 top-1"
              onClick={() => handleDeleteImage(url, i)}
              disabled={deletingIndex !== null}
            />
          </Tooltip>
        </div>
      ))}

      {/* Main preview area */}
      <div className="mt-4 relative">
        <div className="h-48 flex items-center justify-center bg-gray-100 border rounded">
          {previewUrl ||
          (activeImagePreview !== null &&
            images[activeImagePreview]?.trim()) ? (
            <div className="relative w-full h-full">
              <img
                src={previewUrl || images[activeImagePreview]}
                alt="Preview"
                className="max-h-full mx-auto object-contain"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/400x200?text=Invalid+Image";
                  message.error("Failed to load image preview");
                }}
              />
              {/* Delete button on preview */}
              {(previewUrl || images[activeImagePreview]?.trim()) && (
                <Button
                  type="primary"
                  danger
                  icon={
                    deletingIndex === activeImagePreview ? (
                      <Spin size="small" />
                    ) : (
                      <FiTrash2 />
                    )
                  }
                  shape="circle"
                  size="small"
                  className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                  onClick={() =>
                    handleDeleteImage(
                      images[activeImagePreview],
                      activeImagePreview
                    )
                  }
                  disabled={deletingIndex !== null}
                />
              )}
            </div>
          ) : (
            <div className="text-gray-400 flex flex-col items-center">
              <FiImage size={32} />
              <span className="mt-2">No image preview</span>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.filter(
          (img) => img && typeof img === "string" && img.trim() !== ""
        ).length > 1 && (
          <div className="flex mt-2 gap-2 overflow-x-auto py-2">
            {images
              .filter(
                (img) => img && typeof img === "string" && img.trim() !== ""
              )
              .map((img, idx) => {
                const actualIndex = images.indexOf(img);
                return (
                  <div
                    key={`thumb-${idx}`}
                    className={`relative cursor-pointer border-2 rounded overflow-hidden ${
                      activeImagePreview === actualIndex
                        ? "border-blue-500"
                        : "border-gray-200"
                    }`}
                    onClick={() => setActiveImagePreview(actualIndex)}
                  >
                    <div className="h-16 w-16 flex items-center justify-center bg-gray-50">
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/80?text=Invalid";
                        }}
                      />
                      {deletingIndex === actualIndex && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Spin size="small" />
                        </div>
                      )}
                    </div>
                    {/* Delete button on thumbnail */}
                    <Button
                      type="text"
                      danger
                      icon={<FiX />}
                      size="small"
                      className="absolute top-0 right-0 bg-white/70 hover:bg-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(img, actualIndex);
                      }}
                      disabled={deletingIndex !== null}
                    />
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Deduplicate button - only for existing listings */}
      {editingListingId && (
        <Button
          onClick={deduplicateImages}
          loading={deduplicating}
          className="ml-2"
          size="small"
        >
          Fix Duplicates
        </Button>
      )}
    </Form.Item>
  );
};

export default ImagesTab;
