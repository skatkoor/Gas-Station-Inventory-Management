// test.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data'); // Ensure correct import

// Backend server URL
const BACKEND_URL = 'http://localhost:5000/api/ocr';

// Path to your test image
const IMAGE_PATH = path.join(__dirname, 'invoice.png'); // Ensure the image is in the same directory

async function testOCR() {
  try {
    // Check if the image file exists
    if (!fs.existsSync(IMAGE_PATH)) {
      console.error(`Image file "${IMAGE_PATH}" not found.`);
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('image', fs.createReadStream(IMAGE_PATH));

    // Make the POST request to the backend server
    const response = await axios.post(BACKEND_URL, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    // Output the OCR result
    console.log('OCR Result:', response.data.ocrResult);
  } catch (error) {
    if (error.response) {
      console.error('Error Response:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testOCR();
