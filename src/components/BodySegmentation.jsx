import React, { useRef, useState, useEffect } from "react";
import * as bodyPix from "@tensorflow-models/body-pix";
import "@tensorflow/tfjs";

export default function BodySegmentation({ onExtract }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [measurements, setMeasurements] = useState({ shoulder: null, hip: null, waist: null });
  const imgRef = useRef();
  const canvasRef = useRef();
  const [model, setModel] = useState(null);

  // Load BodyPix model
  useEffect(() => {
    async function loadModel() {
      const loadedModel = await bodyPix.load();
      setModel(loadedModel);
    }
    loadModel();
  }, []);

  // Compute simple mask-based measurements
  function computeMeasurements(maskArr, width, height) {
    // 20% (shoulder), 50% (waist), 80% (hip) of image height
    const yShoulder = Math.floor(height * 0.2);
    const yWaist = Math.floor(height * 0.5);
    const yHip = Math.floor(height * 0.8);

    function getWidthAtY(y) {
      let left = null, right = null;
      for (let x = 0; x < width; ++x) {
        if (maskArr[y * width + x] === 1) {
          if (left === null) left = x;
          right = x;
        }
      }
      return left !== null && right !== null ? right - left : null;
    }

    return {
      shoulder: getWidthAtY(yShoulder),
      waist: getWidthAtY(yWaist),
      hip: getWidthAtY(yHip),
    };
  }

  // Run segmentation and draw mask
  const handleImgLoaded = async () => {
    if (!model || !imgRef.current) return;

    // Run segmentation
    const segmentation = await model.segmentPerson(imgRef.current, {
      internalResolution: "medium",
      segmentationThreshold: 0.7,
    });

    // Create a white mask (foreground=white, background=transparent)
    const width = segmentation.width;
    const height = segmentation.height;
    const maskArr = segmentation.data; // 1 for person, 0 for background

    // --- Visualize the mask as white silhouette ---
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
    canvas.style.maxWidth = "320px";
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(maskImageData, 0, 0);

    // --- Compute measurements from mask ---
    const ms = computeMeasurements(maskArr, width, height);
    setMeasurements(ms);

    // Pass results to parent if needed
    if (onExtract) {
      onExtract({
        shoulderWidth: ms.shoulder,
        waist: ms.waist,
        hips: ms.hip
      });
    }
  };

  // Handle file input
  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImgSrc(URL.createObjectURL(e.target.files[0]));
      setMeasurements({ shoulder: null, hip: null, waist: null });
    }
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {imgSrc && (
        <div>
          <img
            ref={imgRef}
            src={imgSrc}
            alt="To analyze"
            crossOrigin="anonymous"
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
            }}
          />
          <div style={{ marginTop: 12, fontFamily: "monospace" }}>
            <b>Shoulder (px):</b> {measurements.shoulder ?? "N/A"}<br />
            <b>Hip (px):</b> {measurements.hip ?? "N/A"}<br />
            <b>Waist (px):</b> {measurements.waist ?? "N/A"}
          </div>
        </div>
      )}
    </div>
  );
}