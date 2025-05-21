import React, { useEffect, useRef, useState } from "react";

// --- Helper: Measurement computation ---
function getBodyMeasurements(landmarks, mask, imgWidth, imgHeight) {
  const shoulder = Math.sqrt(
    Math.pow(landmarks[11].x * imgWidth - landmarks[12].x * imgWidth, 2) +
    Math.pow(landmarks[11].y * imgHeight - landmarks[12].y * imgHeight, 2)
  );
  const hip = Math.sqrt(
    Math.pow(landmarks[23].x * imgWidth - landmarks[24].x * imgWidth, 2) +
    Math.pow(landmarks[23].y * imgHeight - landmarks[24].y * imgHeight, 2)
  );
  let waist = null;
  if (mask && mask.data && mask.width && mask.height) {
    let maskData = mask.data;
    let maskWidth = mask.width;
    let maskHeight = mask.height;
    if (maskData instanceof Uint8ClampedArray) {
      const floatData = new Float32Array(maskWidth * maskHeight);
      for (let i = 0; i < maskWidth * maskHeight; ++i) floatData[i] = maskData[i] / 255.0;
      maskData = floatData;
    }
    const waistY = Math.floor(
      ((landmarks[11].y + landmarks[12].y + landmarks[23].y + landmarks[24].y) / 4) * maskHeight
    );
    for (let dy = -5; dy <= 5; ++dy) {
      const y = Math.min(Math.max(waistY + dy, 0), maskHeight - 1);
      let left = null, right = null;
      for (let x = 0; x < maskWidth; ++x) {
        const i = y * maskWidth + x;
        if (maskData[i] > 0.1) {
          if (left === null) left = x;
          right = x;
        }
      }
      if (left !== null && right !== null) {
        waist = right - left;
        break;
      }
    }
  }
  return {
    shoulder: Math.round(shoulder),
    hip: Math.round(hip),
    waist: waist !== null ? Math.round(waist) : null
  };
}

function paintMaskWhite(maskImageData) {
  const { width, height, data } = maskImageData;
  const whiteImageData = new ImageData(width, height);
  for (let i = 0; i < width * height; ++i) {
    if (data[i * 4 + 3] > 20) {
      whiteImageData.data[i * 4 + 0] = 255;
      whiteImageData.data[i * 4 + 1] = 255;
      whiteImageData.data[i * 4 + 2] = 255;
      whiteImageData.data[i * 4 + 3] = 255;
    } else {
      whiteImageData.data[i * 4 + 3] = 0;
    }
  }
  return whiteImageData;
}

function maskBitmapToWhiteImageData(bitmap, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);

  for (let i = 0; i < width * height; ++i) {
    const v = imageData.data[i * 4];
    if (v > 20) {
      imageData.data[i * 4 + 0] = 255;
      imageData.data[i * 4 + 1] = 255;
      imageData.data[i * 4 + 2] = 255;
      imageData.data[i * 4 + 3] = 255;
    } else {
      imageData.data[i * 4 + 3] = 0;
    }
  }
  return imageData;
}

const TASKS_VISION_URL = "https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0";
const WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export default function ImagePoseSegmentation() {
  const [loading, setLoading] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [debug, setDebug] = useState("");
  const [measurements, setMeasurements] = useState(null);
  const [maskImageData, setMaskImageData] = useState(null);
  const [maskBitmap, setMaskBitmap] = useState(null);
  const [maskDims, setMaskDims] = useState({ width: 0, height: 0 });
  const [visibleMaskImageData, setVisibleMaskImageData] = useState(null);
  const canvasRef = useRef();
  const imgRef = useRef();
  const maskCanvasRef = useRef();

  useEffect(() => {
    let isMounted = true;
    async function loadModel() {
      setLoading(true);
      setDebug("Loading MediaPipe...");
      const { PoseLandmarker, FilesetResolver, DrawingUtils } =
        await import(/* @vite-ignore */ TASKS_VISION_URL);
      setDebug("Loading WASM...");
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      setDebug("Loading pose model...");
      const model = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU"
        },
        runningMode: "IMAGE",
        numPoses: 2,
        outputSegmentationMasks: true
      });
      if (isMounted) {
        setPoseLandmarker({ model, DrawingUtils });
        setDebug("Model loaded.");
      }
      setLoading(false);
    }
    loadModel();
    return () => { isMounted = false; };
  }, []);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImgSrc(URL.createObjectURL(e.target.files[0]));
      setMeasurements(null);
      setMaskImageData(null);
      setMaskBitmap(null);
      setMaskDims({ width: 0, height: 0 });
      setVisibleMaskImageData(null);
      setDebug("Image selected.");
      if (maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext("2d");
        ctx && ctx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      }
    }
  };

  const handleImgLoaded = async () => {
    if (!poseLandmarker) {
      setDebug("Model not ready.");
      return;
    }
    setDebug("Processing image...");
    const { model, DrawingUtils } = poseLandmarker;
    const image = imgRef.current;
    const canvas = canvasRef.current;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    model.detect(image, (result) => {
      console.log("Full result from MediaPipe:", result);
      let mask = null;
      if (result.segmentationMasks?.length) {
        mask = result.segmentationMasks[0];
        if (mask.canvas && typeof createImageBitmap === "function") {
          setMaskDims({ width: mask.canvas.width, height: mask.canvas.height });
          createImageBitmap(mask.canvas).then((bitmap) => {
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            ctx.restore();
            setMaskBitmap(bitmap);
            setMaskImageData(null);
            setDebug("Segmentation mask drawn from OffscreenCanvas.");
          });
        } else if (mask instanceof ImageData) {
          ctx.save();
          ctx.globalAlpha = 0.7;
          ctx.putImageData(mask, 0, 0);
          ctx.restore();
          setMaskImageData(mask);
          setMaskBitmap(null);
          setMaskDims({ width: mask.width, height: mask.height });
        } else if (mask.data && mask.width && mask.height) {
          let imageData = paintMaskWhite(mask);
          ctx.save();
          ctx.globalAlpha = 0.7;
          ctx.putImageData(imageData, 0, 0);
          ctx.restore();
          setMaskImageData(imageData);
          setMaskBitmap(null);
          setMaskDims({ width: mask.width, height: mask.height });
        } else {
          setMaskImageData(null);
          setMaskBitmap(null);
          setDebug("Unknown mask format. Keys: " + Object.keys(mask));
        }
      }

      if (result.landmarks?.length) {
        setDebug((prev) => prev + " Drawing landmarks...");
        const drawingUtils = new DrawingUtils(ctx);
        for (const landmark of result.landmarks) {
          drawingUtils.drawLandmarks(landmark, {
            radius: (data) => DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1)
          });
          drawingUtils.drawConnectors(
            landmark,
            model.constructor.POSE_CONNECTIONS
          );
        }
        setDebug((prev) => prev + " Landmarks drawn.");
      }

      if (result.landmarks?.length && image.naturalWidth && image.naturalHeight) {
        const measurements = getBodyMeasurements(
          result.landmarks[0],
          mask,
          image.naturalWidth,
          image.naturalHeight
        );
        setMeasurements(measurements);
        setDebug((prev) => prev + ` Measurements: S:${measurements.shoulder}, W:${measurements.waist}, H:${measurements.hip}`);
      }
    });
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <br />
      {imgSrc && <img ref={imgRef} src={imgSrc} alt="Input" onLoad={handleImgLoaded} style={{ maxWidth: '100%' }} />}
      <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
      {debug && <pre>{debug}</pre>}
      {measurements && (
        <div>
          <h3>Measurements:</h3>
          <p>Shoulder Width: {measurements.shoulder}px</p>
          <p>Waist Width: {measurements.waist !== null ? `${measurements.waist}px` : 'Not Detected'}</p>
          <p>Hip Width: {measurements.hip}px</p>
        </div>
      )}
    </div>
  );
}
