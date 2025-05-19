import React from "react";
import { Button, Form, Input, Upload, Tooltip, message } from "antd";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";
import { deleteImageAPI } from "../../../utils/api";
import { validateImageFile } from "../../../utils/listingUtils";

const ImagesTab = ({
  images,
  setImages,
  activeImagePreview,
  setActiveImagePreview,
  previewUrl,
  setPreviewUrl,
  editingListingId,
}) => {
  const handleFileUpload = (file) => {
    const validation = validateImageFile(file);

    if (!validation.valid) {
      message.error(validation.message);
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
      setImages((prev) => [...prev.filter(Boolean), e.target.result]);
      setActiveImagePreview(images.length);
    };
    reader.readAsDataURL(file);
    return false; // prevent Upload auto upload
  };

  const handleDeleteImage = async (imageUrl, index) => {
    try {
      console.log("Deleting image:", imageUrl, "at index:", index);

      // If we're editing an existing listing and it's a stored image (not a data URL)
      if (editingListingId && imageUrl && !imageUrl.startsWith("data:")) {
        // Show confirmation dialog
        if (!window.confirm("Are you sure you want to delete this image?")) {
          return;
        }

        try {
          // Call the API to delete the image
          await deleteImageAPI(editingListingId, imageUrl);
          message.success("Image deleted successfully from server!");
        } catch (apiError) {
          console.error("API error when deleting image:", apiError);
          message.error("Failed to delete image from server");
          // Continue with local deletion even if server deletion fails
        }
      }

      // Remove the image from the local state
      let newImages = [...images];
      newImages.splice(index, 1);

      // If no images left, add an empty placeholder
      if (newImages.length === 0) {
        newImages = [""];
      }

      // Remove any empty strings except one placeholder if needed
      newImages = newImages.filter(
        (img, i) =>
          img.trim() !== "" ||
          (img.trim() === "" && i === 0 && newImages.length === 1)
      );

      setImages(newImages);

      // Clear preview URL if it's showing the deleted image
      if (previewUrl === imageUrl) {
        setPreviewUrl(null);
      }

      // Update the active preview if needed
      if (activeImagePreview >= newImages.length) {
        setActiveImagePreview(Math.max(0, newImages.length - 1));
      }
    } catch (err) {
      console.error("Error in handleDeleteImage:", err);
      message.error("Failed to delete image. Please try again.");
    }
  };

  return (
    <Form.Item
      label="Images"
      required
      rules={[
        {
          validator: () => {
            if (images.filter((i) => i?.trim()).length === 0) {
              return Promise.reject("At least one image is required");
            }
            return Promise.resolve();
          },
        },
      ]}
    >
      <Upload
        accept=".jpg,.jpeg,.png"
        showUploadList={false}
        beforeUpload={handleFileUpload}
      >
        <Button icon={<FiPlus />}>Upload</Button>
      </Upload>

      {/* URL inputs */}
      {images.map((url, i) => (
        <div key={i} className="relative mt-2">
          <Input
            className="pr-12"
            value={url}
            placeholder={`Image URL #${i + 1}`}
            onChange={(e) => {
              const next = [...images];
              next[i] = e.target.value;
              setImages(next);
            }}
          />
          <Tooltip title="Delete image">
            <Button
              type="text"
              danger
              icon={<FiTrash2 />}
              className="absolute right-1 top-1"
              onClick={() => handleDeleteImage(url, i)}
            />
          </Tooltip>
        </div>
      ))}

      {/* Preview */}
      <div className="mt-4 relative">
        <div className="h-48 flex items-center justify-center bg-gray-100">
          {previewUrl || images[activeImagePreview]?.trim() ? (
            <div className="relative w-full h-full">
              <img
                src={previewUrl || images[activeImagePreview]}
                alt="Preview"
                className="max-h-full mx-auto object-contain"
                onError={(e) =>
                  (e.currentTarget.src =
                    "https://via.placeholder.com/400x200?text=Invalid")
                }
              />
              <Button
                type="primary"
                danger
                icon={<FiTrash2 />}
                shape="circle"
                size="small"
                className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                onClick={() =>
                  handleDeleteImage(
                    images[activeImagePreview],
                    activeImagePreview
                  )
                }
              />
            </div>
          ) : (
            <span className="text-gray-500">No preview</span>
          )}
        </div>

        {/* Image thumbnails if there are multiple */}
        {images.length > 1 && (
          <div className="flex mt-2 gap-2 overflow-x-auto py-2">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`relative cursor-pointer border-2 rounded overflow-hidden ${
                  idx === activeImagePreview
                    ? "border-blue-500"
                    : "border-gray-200"
                }`}
                onClick={() => setActiveImagePreview(idx)}
              >
                <div className="h-16 w-16">
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://via.placeholder.com/80?text=Invalid";
                    }}
                  />
                </div>
                <Button
                  type="text"
                  danger
                  icon={<FiX />}
                  size="small"
                  className="absolute top-0 right-0 bg-white/70 hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleDeleteImage(img, idx);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Form.Item>
  );
};

export default ImagesTab;
