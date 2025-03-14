export default {
  admin: {
    errors: {
      api_key: {
        invalid_format: "Invalid API key format",
        invalid_key: "Invalid or expired API key",
        save_failed: "Failed to save API key",
        load_failed: "Error loading system API key"
      },
      general: {
        unknown: "Unknown error",
        try_again: "Please try again"
      }
    },
    success: {
      api_key_updated: "System API key updated successfully"
    },
    validation: {
      api_key_required: "API key is required",
      api_key_format: "API key must start with 'sk-ant-'"
    }
  }
};
