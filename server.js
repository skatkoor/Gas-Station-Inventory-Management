// server.js

const express = require('express');
const multer = require('multer');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Together = require('together-ai');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all routes (adjust in production as needed)
app.use(cors());

// Set up multer for handling file uploads
const upload = multer({
  dest: 'uploads/', // Directory to store uploaded files temporarily
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB file size limit
  fileFilter: (req, file, cb) => {
    // Accept only PNG and JPEG files
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg formats are allowed!'));
  },
});

// Initialize Together AI client
const together = new Together({ apiKey: process.env.TOGETHER_API_KEY });

// Endpoint to handle OCR requests
app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const imagePath = req.file.path;

    // Read and encode the image file
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Determine MIME type based on file extension
    const mimeType = path.extname(req.file.originalname).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

    // Remove the uploaded file after encoding
    fs.unlinkSync(imagePath);

    // Prepare messages for the API
    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Perform OCR on this image and extract all text content.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ];

    // Debug: Log messages being sent
    console.log('Sending messages to Together AI:', JSON.stringify(messages, null, 2));

    // Call Together AI API using SDK
    const response = await together.chat.completions.create({
      model: 'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo',
      messages: messages,
      stream: false, // Set to true for streaming responses
    });

    // Debug: Log the full response from Together AI
    console.log('Response from Together AI:', JSON.stringify(response, null, 2));

    // Extract OCR text from the response
    const ocrText =
      response.choices && response.choices.length > 0 && response.choices[0].message && response.choices[0].message.content
        ? response.choices[0].message.content
        : 'No OCR text found.';

    // Send back only the OCR result
    res.json({ ocrResult: ocrText });
  } catch (error) {
    console.error('Error in OCR API:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to perform OCR.' });
  }
});

// Health Check Endpoint
app.get('/', (req, res) => {
  res.send('OCR Backend Server is running.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
