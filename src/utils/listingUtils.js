export const sanitizeAmenityText = (amenity) => {
  if (!amenity) return "";

  // First convert to string if not already
  let text = String(amenity);

  // Remove any square brackets, quotes, and other problematic characters
  text = text.replace(/[[\]\\/"']/g, "");

  // Clean any leading/trailing whitespace
  text = text.trim();

  return text;
};

export const parseAttributes = (attributesString) => {
  if (!attributesString) return {};

  try {
    // If it's already a comma-separated string, return it as is
    if (typeof attributesString === "string" && attributesString.includes(",")) {
      return attributesString;
    }

    // Try parsing the string to an object
    let parsed = attributesString;

    // Handle potentially multiple levels of JSON stringification
    while (typeof parsed === "string") {
      try {
        const nextLevel = JSON.parse(parsed);
        if (
          typeof nextLevel === "string" &&
          (nextLevel.startsWith("{") || nextLevel.startsWith("["))
        ) {
          parsed = nextLevel;
        } else {
          parsed = nextLevel;
          break;
        }
      } catch {
        // If we can't parse further, use what we have
        break;
      }
    }

    // Check if we ended up with an object with numeric keys (0-10 characters)
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      // Check if this looks like a character-by-character object
      const keys = Object.keys(parsed);
      const isCharacterByCharacter =
        keys.length > 0 && keys.every((k, i) => k === String(i));

      if (isCharacterByCharacter) {
        // Reconstruct the original string and try one more parse
        const reconstructed = keys.map((k) => parsed[k]).join("");
        try {
          return JSON.parse(reconstructed);
        } catch {
          return reconstructed;
        }
      }

      // If it's a regular object, convert to comma-separated string
      return Object.keys(parsed).join(", ");
    }

    return typeof parsed === "object" ? parsed : String(parsed);
  } catch (error) {
    console.error("Error parsing attributes:", error);
    return {};
  }
};

export const parseAmenities = (amenitiesArray) => {
  if (!amenitiesArray || !Array.isArray(amenitiesArray)) return [];

  return amenitiesArray
    .map((amenity) => {
      if (!amenity) return "";

      // Handle string wrapped in quotes and brackets like ["Car"]
      if (typeof amenity === "string") {
        try {
          // If it looks like JSON, try to parse it
          if (amenity.trim().startsWith("[") && amenity.trim().endsWith("]")) {
            const parsed = JSON.parse(amenity);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed[0];
            }
          }
          // Clean up the amenity by removing brackets, slashes and quotes
          return amenity.replace(/[[\]\\/"']/g, "").trim();
        } catch {
          // If parsing fails, just clean up the string
          return amenity.replace(/[[\]\\/"']/g, "").trim();
        }
      }
      return String(amenity)
        .replace(/[[\]\\/"']/g, "")
        .trim();
    })
    .filter(Boolean);
};

export const validateImageFile = (file) => {
  // Check file type
  const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: "Only JPG, PNG or WebP files are allowed"
    };
  }

  // Check file size (5MB limit)
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `Image is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 5MB.`
    };
  }

  return { valid: true };
};

export const getCategoryName = (categoryId, categories) => {
  if (!categoryId) return "Uncategorized";

  // If categoryId is an object with _id property
  if (typeof categoryId === "object" && categoryId?._id) {
    const category = categories.find((c) => c._id === categoryId._id);
    return category ? category.name : "Unknown";
  }

  // If categoryId is a string (direct ID)
  const category = categories.find((c) => c._id === categoryId);
  return category ? category.name : "Unknown";
};