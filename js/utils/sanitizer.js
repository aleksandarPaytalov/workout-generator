/**
 * Sanitizer Utility Module
 * 
 * Provides HTML sanitization and input validation to prevent XSS attacks
 * 
 * @namespace Sanitizer
 */

const Sanitizer = (() => {
  "use strict";

  /**
   * Escape HTML special characters to prevent XSS
   * @param {string} str - String to escape
   * @returns {string} Escaped string safe for HTML insertion
   * @public
   */
  const escapeHTML = (str) => {
    if (typeof str !== "string") {
      return "";
    }

    const htmlEscapeMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "/": "&#x2F;",
    };

    return str.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
  };

  /**
   * Unescape HTML entities (for display in textarea)
   * @param {string} str - String to unescape
   * @returns {string} Unescaped string
   * @public
   */
  const unescapeHTML = (str) => {
    if (typeof str !== "string") {
      return "";
    }

    const htmlUnescapeMap = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#x27;": "'",
      "&#x2F;": "/",
    };

    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#x27;|&#x2F;/g, (entity) => htmlUnescapeMap[entity]);
  };

  /**
   * Sanitize text for safe display in HTML
   * Removes potentially dangerous characters and limits length
   * @param {string} text - Text to sanitize
   * @param {number} maxLength - Maximum allowed length (default: 10000)
   * @returns {string} Sanitized text
   * @public
   */
  const sanitizeText = (text, maxLength = 10000) => {
    if (typeof text !== "string") {
      return "";
    }

    // Trim whitespace
    let sanitized = text.trim();

    // Limit length to prevent DoS
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    // Escape HTML
    sanitized = escapeHTML(sanitized);

    return sanitized;
  };

  /**
   * Sanitize workout notes specifically
   * @param {string} notes - Notes text to sanitize
   * @returns {string} Sanitized notes
   * @public
   */
  const sanitizeNotes = (notes) => {
    if (typeof notes !== "string") {
      return "";
    }

    // Trim and limit length (max 1000 characters for notes)
    let sanitized = notes.trim();
    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 1000);
    }

    // Remove any HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, "");

    // Remove script-like content
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=/gi, "");

    // Escape HTML entities
    sanitized = escapeHTML(sanitized);

    return sanitized;
  };

  /**
   * Sanitize workout ID
   * @param {string} id - ID to sanitize
   * @returns {string} Sanitized ID
   * @public
   */
  const sanitizeID = (id) => {
    if (typeof id !== "string") {
      return "";
    }

    // Only allow alphanumeric, hyphens, and underscores
    return id.replace(/[^a-zA-Z0-9\-_]/g, "");
  };

  /**
   * Validate and sanitize URL
   * @param {string} url - URL to validate
   * @returns {string|null} Sanitized URL or null if invalid
   * @public
   */
  const sanitizeURL = (url) => {
    if (typeof url !== "string") {
      return null;
    }

    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
        return null;
      }

      return urlObj.href;
    } catch (e) {
      return null;
    }
  };

  /**
   * Sanitize number input
   * @param {any} value - Value to sanitize as number
   * @param {number} min - Minimum allowed value
   * @param {number} max - Maximum allowed value
   * @param {number} defaultValue - Default value if invalid
   * @returns {number} Sanitized number
   * @public
   */
  const sanitizeNumber = (value, min = 0, max = Number.MAX_SAFE_INTEGER, defaultValue = 0) => {
    const num = Number(value);

    if (isNaN(num)) {
      return defaultValue;
    }

    if (num < min) {
      return min;
    }

    if (num > max) {
      return max;
    }

    return num;
  };

  /**
   * Sanitize object for safe storage
   * Recursively sanitizes all string values in an object
   * @param {object} obj - Object to sanitize
   * @param {number} maxDepth - Maximum recursion depth (default: 5)
   * @returns {object} Sanitized object
   * @public
   */
  const sanitizeObject = (obj, maxDepth = 5) => {
    if (maxDepth <= 0) {
      return {};
    }

    if (typeof obj !== "object" || obj === null) {
      return {};
    }

    const sanitized = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (typeof value === "string") {
          sanitized[key] = sanitizeText(value);
        } else if (typeof value === "number") {
          sanitized[key] = value;
        } else if (typeof value === "boolean") {
          sanitized[key] = value;
        } else if (Array.isArray(value)) {
          sanitized[key] = value.map((item) =>
            typeof item === "object" ? sanitizeObject(item, maxDepth - 1) : sanitizeText(String(item))
          );
        } else if (typeof value === "object" && value !== null) {
          sanitized[key] = sanitizeObject(value, maxDepth - 1);
        }
      }
    }

    return sanitized;
  };

  /**
   * Check if string contains potentially dangerous content
   * @param {string} str - String to check
   * @returns {boolean} True if dangerous content detected
   * @public
   */
  const containsDangerousContent = (str) => {
    if (typeof str !== "string") {
      return false;
    }

    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\(/i,
      /expression\(/i,
    ];

    return dangerousPatterns.some((pattern) => pattern.test(str));
  };

  // Public API
  return {
    escapeHTML,
    unescapeHTML,
    sanitizeText,
    sanitizeNotes,
    sanitizeID,
    sanitizeURL,
    sanitizeNumber,
    sanitizeObject,
    containsDangerousContent,
  };
})();

// Make available globally
if (typeof window !== "undefined") {
  window.Sanitizer = Sanitizer;
}

