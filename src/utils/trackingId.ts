const generateTrackingId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();

  const random = Math.random().toString(36).substring(2, 7).toUpperCase();

  return `YD-${timestamp}-${random}`;
};

export default generateTrackingId;
