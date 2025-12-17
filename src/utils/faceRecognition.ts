// src/utils/faceRecognition.ts
import * as faceapi from '@vladmandic/face-api';

// Configuration
const MODEL_URL = import.meta.env.BASE_URL + 'models';

let modelsLoadedFlag = false;

/**
 * Initialize and load face-api models
 * Uses @vladmandic/face-api modern API
 */
export const loadModels = async (): Promise<void> => {
  if (modelsLoadedFlag) {
    console.log('Models already loaded');
    return;
  }

  try {
    console.log('Initializing @vladmandic/face-api environment...');

    // Load all required models
    // Backend initialization happens automatically in @vladmandic/face-api
    console.log('Loading Face API models...');

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);

    modelsLoadedFlag = true;
    console.log('✅ @vladmandic/face-api models loaded successfully');
    
  } catch (error) {
    console.error('❌ Error loading face-api models:', error);
    modelsLoadedFlag = false;
    throw new Error('Failed to load face recognition models');
  }
};

/**
 * Get face embedding (descriptor) from video/image/canvas element
 * Returns a 128-dimensional vector representing the face
 */
export const getFaceEmbedding = async (
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<number[] | null> => {
  try {
    if (!modelsLoadedFlag) {
      throw new Error('Models not loaded. Call loadModels() first.');
    }

    // Detect face with landmarks and descriptor
    const detection = await faceapi
      .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ 
        minConfidence: 0.5
      }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      console.log('No face detected in input');
      return null;
    }

    // Get the descriptor (embedding)
    const descriptor = detection.descriptor;
    
    if (!descriptor || descriptor.length !== 128) {
      console.error('Invalid descriptor length:', descriptor?.length);
      return null;
    }

    // Convert Float32Array to regular number array for database storage
    const embedding = Array.from(descriptor);
    console.log(`✅ Face embedding generated: ${embedding.length} dimensions`);
    
    return embedding;
    
  } catch (error) {
    console.error('❌ Error generating face embedding:', error);
    return null;
  }
};

/**
 * Detect all faces in an image (useful for multi-face scenarios)
 * Returns array of face detections with landmarks and descriptors
 */
export const detectAllFaces = async (
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
) => {
  try {
    if (!modelsLoadedFlag) {
      throw new Error('Models not loaded. Call loadModels() first.');
    }

    const detections = await faceapi
      .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ 
        minConfidence: 0.5 
      }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    return detections;
    
  } catch (error) {
    console.error('Error detecting faces:', error);
    return [];
  }
};

/**
 * Compare two face embeddings and return similarity score (0-100)
 * Uses Euclidean distance calculation
 */
export const compareFaceEmbeddings = (
  embedding1: number[],
  embedding2: number[]
): number => {
  if (embedding1.length !== 128 || embedding2.length !== 128) {
    throw new Error(`Invalid embedding dimensions: ${embedding1.length}, ${embedding2.length}`);
  }

  // Calculate Euclidean distance
  let sumSquaredDiff = 0;
  for (let i = 0; i < 128; i++) {
    const diff = embedding1[i] - embedding2[i];
    sumSquaredDiff += diff * diff;
  }
  
  const distance = Math.sqrt(sumSquaredDiff);
  
  // Convert distance to similarity percentage
  // Face-api.js typical matching threshold is 0.6
  // Distance of 0 = 100% similar
  // Distance of 0.6 = 0% similar (threshold)
  const threshold = 0.6;
  const similarity = Math.max(0, 100 * (1 - distance / threshold));
  
  return Math.min(100, similarity);
};

/**
 * Alternative comparison using face-api's built-in distance calculation
 */
export const compareFaceEmbeddingsAdvanced = (
  embedding1: number[],
  embedding2: number[]
): { distance: number; similarity: number; isMatch: boolean } => {
  if (embedding1.length !== 128 || embedding2.length !== 128) {
    throw new Error(`Invalid embedding dimensions: ${embedding1.length}, ${embedding2.length}`);
  }

  // Calculate Euclidean distance manually
  let sumSquaredDiff = 0;
  for (let i = 0; i < 128; i++) {
    const diff = embedding1[i] - embedding2[i];
    sumSquaredDiff += diff * diff;
  }
  const distance = Math.sqrt(sumSquaredDiff);
  
  // Standard threshold for face matching (lower = more similar)
  const threshold = 0.6;
  const isMatch = distance < threshold;
  
  // Convert to similarity percentage
  const similarity = Math.max(0, 100 * (1 - distance / threshold));
  
  return {
    distance,
    similarity: Math.min(100, similarity),
    isMatch
  };
};

/**
 * Draw face detection boxes on canvas (useful for debugging)
 */
export const drawDetections = (
  canvas: HTMLCanvasElement,
  detections: any[]
): void => {
  const displaySize = { width: canvas.width, height: canvas.height };
  faceapi.matchDimensions(canvas, displaySize);
  
  const resizedDetections = faceapi.resizeResults(detections, displaySize);
  
  // Draw detection boxes
  if (resizedDetections && resizedDetections.length > 0) {
    resizedDetections.forEach((detection: any) => {
      const box = detection.detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, { 
        label: `${Math.round(detection.detection.score * 100)}%` 
      });
      drawBox.draw(canvas);
    });
  }
};

/**
 * Get optimal input dimensions for face detection
 */
export const getOptimalDimensions = (
  videoWidth: number,
  videoHeight: number
): { width: number; height: number } => {
  // Optimal dimensions for face detection (balance between speed and accuracy)
  const maxDimension = 640;
  
  const aspectRatio = videoWidth / videoHeight;
  
  if (videoWidth > videoHeight) {
    return {
      width: Math.min(maxDimension, videoWidth),
      height: Math.min(maxDimension / aspectRatio, videoHeight)
    };
  } else {
    return {
      width: Math.min(maxDimension * aspectRatio, videoWidth),
      height: Math.min(maxDimension, videoHeight)
    };
  }
};

/**
 * Check if models are loaded
 */
export const areModelsLoaded = (): boolean => {
  return modelsLoadedFlag;
};

/**
 * Warm up the model (run dummy prediction to initialize GPU)
 */
export const warmupModel = async (): Promise<void> => {
  try {
    console.log('Warming up face detection model...');
    
    // Create a small dummy canvas
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Fill with gray (simulating a face-like input)
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 128, 128);
      
      // Run a dummy detection
      await faceapi.detectSingleFace(
        canvas, 
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      );
      
      console.log('✅ Model warmup complete');
    }
  } catch (error) {
    console.warn('Model warmup failed (non-critical):', error);
  }
};

/**
 * Extract face embedding from an image blob/file
 * Useful for processing uploaded images
 */
export const getFaceEmbeddingFromFile = async (
  file: File | Blob
): Promise<number[] | null> => {
  try {
    // Create image element from file
    const img = await faceapi.bufferToImage(file);
    
    // Get embedding from image
    return await getFaceEmbedding(img);
  } catch (error) {
    console.error('Error processing image file:', error);
    return null;
  }
};