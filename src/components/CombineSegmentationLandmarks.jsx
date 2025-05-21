import React, { useRef, useState, useEffect } from "react";
import * as bodyPix from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";
import { PoseLandmarker, FilesetResolver } from "@mediapipe/tasks-vision"; 

export default function CombinedSegmentationLandmarks({ onExtract }) {
  const [imgSrc, setImgSrc] = useState(null);
  const imgRef = useRef();
  const canvasRef = useRef();
  const [bodyPixModel, setBodyPixModel] = useState(null);
  const [poseModel, setPoseModel] = useState(null);
  const [results, setResults] = useState({ mask: null, landmarks: null });
  const [status, setStatus] = useState("Waiting for image...");
  const [measurements, setMeasurements] = useState(null);

  // Load models
  useEffect(() => {
    setStatus("Loading BodyPix model...");
    bodyPix.load().then(model => {
      setBodyPixModel(model);
      setStatus("Loading Pose Landmarker...");
      FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm").then(vision => {
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task" },
          runningMode: "IMAGE",
          numPoses: 1
        }).then(poseModel => {
          setPoseModel(poseModel);
          setStatus("Ready! Upload an image.");
        });
      });
    });
  }, []);

  // Handle file input
  function handleImageChange(e) {
    if (e.target.files[0]) {
      setImgSrc(URL.createObjectURL(e.target.files[0]));
      setResults({ mask: null, landmarks: null });
      setStatus("Image selected. Processing...");
      setMeasurements(null);
      // Clear canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }

  // On image load, run both models
  async function handleImgLoaded() {
    if (!bodyPixModel || !poseModel || !imgRef.current) {
      setStatus("Models are not loaded yet.");
      return;
    }
    setStatus("Running segmentation...");
    const image = imgRef.current;

    // 1. Get segmentation
    const segmentation = await bodyPixModel.segmentPerson(image, {
      internalResolution: "medium",
      segmentationThreshold: 0.7,
    });

    setStatus("Running pose detection...");
    // 2. Get pose landmarks
    const pose = await poseModel.detect(image);

    setResults({ mask: segmentation, landmarks: pose.landmarks?.[0] });
    setStatus("Processing results...");
  }

  // Draw segmentation mask as white silhouette and landmarks as bright color dots
  useEffect(() => {
    if (!results.mask) return;

    const mask = results.mask;
    const width = mask.width, height = mask.height;
    const maskArr = mask.data;

    // --- Draw mask as white silhouette (foreground=white, background=transparent) ---
    const maskImageData = new ImageData(width, height);
    for (let i = 0; i < width * height; ++i) {
      if (maskArr[i] === 1) {
        maskImageData.data[i * 4 + 0] = 255;
        maskImageData.data[i * 4 + 1] = 255;
        maskImageData.data[i * 4 + 2] = 255;
        maskImageData.data[i * 4 + 3] = 255;
      } else {
        maskImageData.data[i * 4 + 3] = 0;
      }
    }
    // Draw to canvas
    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(maskImageData, 0, 0);

    // --- Draw landmarks in very bright color (e.g. neon pink) ---
    if (results.landmarks) {
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = "#ff00ff"; // neon pink
      ctx.strokeStyle = "#ffff00"; // neon yellow border
      ctx.lineWidth = 2;
      for (let i = 0; i < results.landmarks.length; ++i) {
        const lm = results.landmarks[i];
        const x = lm.x * width;
        const y = lm.y * height;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    setStatus("Segmentation mask and landmarks drawn.");
  }, [results.mask, results.landmarks]);

  // Combine mask + landmarks for more accurate measurement
  useEffect(() => {
    if (!results.mask || !results.landmarks) return;
    const { mask, landmarks } = results;
    const width = mask.width, height = mask.height;
    const maskArr = mask.data;

    // --- Compute shoulder and hip width (joint-to-joint, with hip expansion) ---
    function euclideanDist(lm1, lm2) {
      const dx = (lm1.x - lm2.x) * width;
      const dy = (lm1.y - lm2.y) * height;
      return Math.sqrt(dx * dx + dy * dy);
    }

    const shoulderWidth = euclideanDist(landmarks[11], landmarks[12]);
    const hipWidth = euclideanDist(landmarks[23], landmarks[24]) + 20; // expand hip width by 20px

    // --- Robust Waist Width: Scan only between hips (avoid arms) ---
    // Estimate waist y-position: 1/3 between hips and shoulders
    const leftShoulder = landmarks[11], rightShoulder = landmarks[12];
    const leftHip = landmarks[23], rightHip = landmarks[24];
    const shoulderY = (leftShoulder.y + rightShoulder.y) / 2 * height;
    const hipY = (leftHip.y + rightHip.y) / 2 * height;
    const waistY = Math.floor(hipY - (hipY - shoulderY) * 0.33);

    // X-values for hips (in px)
    const hipLeftX = leftHip.x * width;
    const hipRightX = rightHip.x * width;
    const margin = 10; // px expansion on each side for tissue
    const scanStart = Math.max(0, Math.floor(Math.min(hipLeftX, hipRightX) - margin));
    const scanEnd = Math.min(width - 1, Math.ceil(Math.max(hipLeftX, hipRightX) + margin));

    let waistLeft = null, waistRight = null;
    for (let x = scanStart; x <= scanEnd; ++x) {
      if (maskArr[waistY * width + x] === 1) {
        if (waistLeft === null) waistLeft = x;
        waistRight = x;
      }
    }
    const waistWidth = (waistLeft !== null && waistRight !== null) ? waistRight - waistLeft : null;

    setMeasurements({
      shoulderWidth,
      hips: hipWidth,
      waist: waistWidth
    });

    setStatus("Measurements extracted!");
    if (onExtract) {
      onExtract({
        shoulderWidth,
        hips: hipWidth,
        waist: waistWidth,
      });
    }
  }, [results]);

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      <div style={{ margin: "10px 0", color: "#1a73e8", fontWeight: "bold" }}>{status}</div>
      {imgSrc && (
        <div>
          <img
            ref={imgRef}
            src={imgSrc}
            alt="To analyze"
            style={{ display: "block", maxWidth: 320 }}
            onLoad={handleImgLoaded}
          />
          <canvas
            ref={canvasRef}
            style={{
              border: "1px solid #888",
              maxWidth: 320,
              background: "#222",
              marginTop: 10,
              display: "block"
            }}
          />
          {measurements && (
            <div style={{ marginTop: 12, fontFamily: "monospace", color: "#222", background: "#eef", padding: "8px", borderRadius: "6px" }}>
              <b>Shoulder (joint-to-joint px):</b> {measurements.shoulderWidth ? measurements.shoulderWidth.toFixed(1) : "N/A"}<br />
              <b>Hip (joint-to-joint px, expanded):</b> {measurements.hips ? measurements.hips.toFixed(1) : "N/A"}<br />
              <b>Waist (silhouette px, arms ignored):</b> {measurements.waist ?? "N/A"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}